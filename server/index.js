const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const prisma = require('./lib/prisma');
const multer = require('multer');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const upload = multer();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// --- UTILITIES ---
function cleanJsonResponse(text) {
    try {
        // Robust cleaning: remove markdown blocks (```json ... ```)
        const regex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
        const match = regex.exec(text);
        const jsonPart = match ? match[1] : text;
        return JSON.parse(jsonPart.trim());
    } catch (e) {
        console.error("[Hardening] Raw LLM Response:", text);
        throw new Error("Neural output was malformed. Please try again.");
    }
}

// --- ROTATING GEMINI INTELLIGENCE ---
class GeminiManager {
    constructor() {
        const keys = process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',') : [];
        this.genAIs = keys.map(k => new GoogleGenerativeAI(k.trim()));
        this.currentIndex = 0;
    }

    getModel() {
        if (this.genAIs.length === 0) throw new Error("No Gemini API keys configured");
        const instance = this.genAIs[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.genAIs.length;
        return instance.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    async analyzeResume(text, role) {
        const model = this.getModel();
        const prompt = `
            Analyze this candidate's resume for the role of ${role}.
            Resume Text: ${text}

            Return a valid JSON object WITH NO MARKDOWN BLOCKS. EXACTLY THIS FORMAT:
            {
                "score": number (0-100),
                "skills": string[],
                "summary": "Exactly two paragraphs of professional feedback.",
                "detailedAnalysis": {
                    "technicalDeepDive": object,
                    "experienceArchitecture": object,
                    "culturalCalibration": object
                },
                "reason": "Short summary of why they match."
            }
        `;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return cleanJsonResponse(response.text());
    }

    async extractJD(text) {
        const model = this.getModel();
        const prompt = `
            You are a professional HR system. Extract ALL structural job details from this job description text.
            Text: ${text}

            Return a valid JSON object with NO MARKDOWN BLOCKS. Capture every section you find. EXACTLY THIS FORMAT:
            {
                "title": "Job title (string)",
                "department": "Department name (string)",
                "location": "Location including city, country, remote/hybrid (string)",
                "type": "Job type e.g. Full-Time, Internship, Part-Time (string)",
                "skills": ["Array of required technical skills"],
                "description": "Full 'About the Role' or intro paragraph as-is",
                "responsibilities": "All bullet points from 'Key Responsibilities' section, formatted as a numbered or bulleted list",
                "requirements": "All bullet points from 'Requirements & Qualifications' section, formatted as a list",
                "bonusPoints": "All bullet points from 'Bonus Points' or 'Nice to have' section. Empty string if not found.",
                "benefits": "Company perks, stipend, salary, compensation mentioned",
                "interviewProcess": "Interview stages or hiring process if mentioned. Empty string if not found.",
                "culture": "Team culture, company mission, or 'About the Company' snippet"
            }
        `;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return cleanJsonResponse(response.text());
    }
}

const gemini = new GeminiManager();

// Health Check
app.get('/', (req, res) => {
    res.json({ message: "HireAI Neural Engine is Live", status: "Healthy" });
});

// 1. Candidate List
app.get('/api/candidates', async (req, res) => {
    try {
        const candidates = await prisma.candidate.findMany({ orderBy: { match: 'desc' } });
        res.json(candidates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Active Jobs List
app.get('/api/jobs', async (req, res) => {
    try {
        const jobs = await prisma.job.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Resume Upload (GEMINI POWERED)
app.post('/api/candidates', upload.single('resumePdf'), async (req, res) => {
    try {
        const { email, name, role } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });

        let extractedText = "No resume text found.";
        if (req.file) {
            const pdfData = await pdf(req.file.buffer);
            extractedText = pdfData.text;
        }

        console.log(`[Neural Engine] Analyzing resume for ${email}...`);
        const ai = await gemini.analyzeResume(extractedText, role || "Software Engineer");

        const candidate = await prisma.candidate.upsert({
            where: { email },
            update: {
                match: ai.score,
                skills: ai.skills,
                summary: ai.summary,
                detailedAnalysis: ai.detailedAnalysis,
                feedback: ai.reason,
                status: 'Top Pick'
            },
            create: {
                email,
                name: name || 'Applicant',
                role: role || 'Candidate',
                match: ai.score,
                skills: ai.skills,
                summary: ai.summary,
                detailedAnalysis: ai.detailedAnalysis,
                feedback: ai.reason,
                status: 'Top Pick',
                applied: 'Just now'
            }
        });

        res.json(candidate);
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 4. JD Extraction (GEMINI POWERED)
app.post('/api/jobs/upload', upload.single('jdPdf'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        console.log(`[Neural Engine] Extracting JD structural data...`);
        const pdfData = await pdf(req.file.buffer);
        const data = await gemini.extractJD(pdfData.text);
        
        res.json(data);
    } catch (err) {
        console.error("[Hardening] Extraction failure:", err);
        res.status(500).json({ error: err.message });
    }
});

// 4.1 Create Job
app.post('/api/jobs', async (req, res) => {
    try {
        const job = await prisma.job.create({
            data: {
                ...req.body,
                status: 'Active',
                posted: 'Just now',
                applicants: 0
            }
        });
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4.2 Delete Job
app.delete('/api/jobs/:id', async (req, res) => {
    try {
        await prisma.job.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: "Job deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Recommendations
app.get('/api/candidates/recommendations', async (req, res) => {
    try {
        const jobs = await prisma.job.findMany();
        const results = jobs.map(job => ({
            id: job.id,
            matchPercent: Math.floor(Math.random() * (95 - 60 + 1)) + 60,
            reason: "High alignment with organizational growth goals."
        }));
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running with Neural Gemini Engine at http://0.0.0.0:${PORT}`);
});
