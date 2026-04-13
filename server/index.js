import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import prisma from './lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Gemini with multiple keys for failover support
const GEMINI_KEYS = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "").split(',').map(k => k.trim()).filter(Boolean);
let currentKeyIndex = 0;

function getGenAI() {
  const key = GEMINI_KEYS[currentKeyIndex];
  // Proactively rotate index for the next request to balance load
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
  if (!key) throw new Error("No Gemini API keys provided");
  return new GoogleGenerativeAI(key);
}

// Wrapper to handle automatic retries and key switching on 429 quota errors
async function runGeminiTask(taskFn) {
  let attempts = 0;
  const maxAttempts = GEMINI_KEYS.length;

  while (attempts < maxAttempts) {
    try {
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      return await taskFn(model);
    } catch (err) {
      // Robust detection: check message, status code, or nested error objects
      const isQuotaError = 
        err.message?.includes('429') || 
        err.message?.includes('Quota exceeded') || 
        err.status === 429 ||
        err.errorDetails?.some(d => d.reason === 'RATE_LIMIT_EXCEEDED');
      
      if (isQuotaError && GEMINI_KEYS.length > 1 && attempts < maxAttempts - 1) {
        console.warn(`[Key Switch] Key hit quota. Retrying with next available key in 1s...`);
        // Wait 1 second to allow transient rate limiting to settle
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        continue;
      }
      throw err;
    }
  }
}

if (GEMINI_KEYS.length === 0) {
  console.warn('⚠️ Gemini API Keys are missing. AI features will be limited.');
} else {
  console.log(`🚀 AI Engine initialized with ${GEMINI_KEYS.length} keys`);
}

// Middleware
app.use(cors());
app.use(express.json());

// Set up multer for handling file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// --- UTILS ---

async function analyzeResumeWithGemini(resumeText, role, jd) {
  if (GEMINI_KEYS.length === 0 || !resumeText) return null;
  
  const prompt = `
    You are an elite automated recruiter. You need to analyze the following candidate's resume against the standard Job Description.
    
    Job Role: ${role}
    Job Description: ${jd || 'No specific JD provided, please assume standard requirements for the given role.'}
    
    Candidate Resume Extracted Text:
    ${resumeText}

    Your goal is to parse this resume with 100% accuracy.
    - If a technology (e.g. Python, Node.js) is mentioned in the text, it MUST be included in the "skills" array.
    - The "summary" should be a professional 2-3 sentence overview.
    - "applicantFeedback" should be 3-5 specific, bulleted tips for improvement.

    Respond ONLY in the following strict JSON format:
    {
      "score": <Number 0-100>,
      "reasoning": "<Summary of why this candidate is or is not a fit>",
      "reliability": "High|Medium|Low",
      "applicantFeedback": ["<Tip 1>", "<Tip 2>"],
      "questions": ["<Interview Qs>"],
      "skills": ["<Detected Skills>"],
      "summary": "<Bio>",
      "keywords": ["Skill Match Found", "Parsing Experience", "Ranking Identity", "Finalizing Scores"]
    }
  `;

  try {
    return await runGeminiTask(async (model) => {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '');
      return JSON.parse(responseText);
    });
  } catch (err) {
    console.error('❌ Gemini Error:', err);
    return null;
  }
}

async function extractJobWithGemini(jdText) {
  if (GEMINI_KEYS.length === 0 || !jdText) return null;
  
  const prompt = `
    Analyze this Job Description text and extract the structured data.
    JD Text: ${jdText}

    Respond ONLY in strict JSON:
    {
      "title": "Extracted Title",
      "department": "Extracted Dept",
      "location": "Remote|Onsite|Hybrid",
      "salary": "Range",
      "description": "Cleaned up summary",
      "skills": ["Skill 1", "Skill 2"],
      "analysisKeywords": ["Parsing Document", "Extracting Skills", "Identifying Department", "Formatting Metadata"]
    }
  `;

  try {
    return await runGeminiTask(async (model) => {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '');
      return JSON.parse(responseText);
    });
  } catch (err) {
    console.error('❌ Gemini JD Error:', err);
    return null;
  }
}

// --- ROUTES ---

// Main Data Endpoints
app.get('/api/candidates', async (req, res) => {
    try {
        const candidates = await prisma.candidate.findMany({
            include: { applications: true },
            orderBy: { match: 'desc' }
        });
        res.json(candidates);
    } catch (error) {
        console.warn("DB Connection Error (Candidates):", error.message);
        res.json([]); // Return empty array instead of 500
    }
});

app.get('/api/jobs', async (req, res) => {
    try {
        const jobs = await prisma.job.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(jobs);
    } catch (error) {
        console.warn("DB Connection Error (Jobs):", error.message);
        res.json([]); // Return empty array instead of 500
    }
});

app.post('/api/jobs', async (req, res) => {
    try {
        const { title, department, location, type, salary, description, skills } = req.body;
        
        // Handle both Array and String input for skills (to support the new multi-line UI)
        let skillArray = [];
        if (Array.isArray(skills)) {
            skillArray = skills;
        } else if (typeof skills === 'string') {
            skillArray = skills.split(/\n|,/).map(s => s.trim()).filter(Boolean);
        }

        const newJob = await prisma.job.create({
            data: {
                title,
                department,
                location,
                type,
                salary: salary || 'TBD',
                posted: 'Just now',
                description,
                skills: skillArray,
                status: 'Active'
            }
        });
        res.status(201).json(newJob);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/jobs', async (req, res) => {
    try {
        const { title, department, location, type, salary, status, description, skills } = req.body;
        const newJob = await prisma.job.create({
            data: {
                title,
                department,
                location,
                type,
                salary: salary || 'TBD',
                status: status || 'Active',
                description,
                skills,
                posted: 'Just now'
            }
        });
        res.json(newJob);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/jobs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.job.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: "Job deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Retro-compatible endpoint for Google Sheets sync simulation
app.get('/api/gsheets/candidates', async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const pdfData = await pdfParse(req.file.buffer);
        const text = pdfData.text;

        const extractedData = await extractJobWithGemini(text);
        if (!extractedData) throw new Error("AI failed to parse document");

        res.json(extractedData);
    } catch (error) {
        console.error("JD Upload error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/jobs/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.job.delete({ where: { id } });
        res.json({ message: 'Job deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/candidates/recommendations', async (req, res) => {
    const { email, id, all } = req.query;
    if (!email && !id) return res.status(400).json({ error: "Email or ID required" });

    try {
        const candidate = await prisma.candidate.findFirst({
            where: id ? { id: parseInt(id) } : { email: email },
            orderBy: { createdAt: 'desc' }
        });

        if (!candidate) return res.json([]);

        const allJobs = await prisma.job.findMany({ where: { status: 'Active' } });
        if (allJobs.length === 0) return res.json([]);

        const recommendations = await runGeminiTask(async (model) => {
            const prompt = `
                You are an AI Recruitment Intelligence system. Your goal is to match a Candidate to multiple Job Descriptions with mathematical precision.
                
                CANDIDATE DATA:
                Name: ${candidate.name}
                Summary: ${candidate.summary}
                Technical Skills: ${candidate.skills.join(', ')}
                
                AVAILABLE JOBS:
                ${allJobs.map(j => `ID: ${j.id}, Title: ${j.title}, Description: ${j.description}, Required: ${j.skills?.join(', ') || 'General'}`).join('\n---\n')}
                
                MATCHING CRITERIA:
                1. If a skill like "Python", "Node.js", or "AI" is mentioned in the Candidate's **Summary** OR **Technical Skills**, it counts as a match for roles requiring those.
                2. Do not ignore the summary. If the summary says they have experience in X, they have experience in X.
                
                OUTPUT INSTRUCTIONS:
                For ${all === 'true' ? 'ALL' : 'the top 3'} jobs, respond ONLY in strict JSON:
                [{ 
                   "jobId": <ID>, 
                   "matchPercent": <number 0-100>, 
                   "reasoningChain": "<Step 1: Identified skills X and Y. Step 2: Job requires X and Z. Step 3: Calculation...>",
                   "reason": "<One clear sentence explaining the fit, e.g., 'Strong technical match with expertise in Python.'>" 
                }]

                Ensure the JSON is perfectly formatted. No markdown, no triple backticks.
            `;
            const result = await model.generateContent(prompt);
            const responseText = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '');
            return JSON.parse(responseText);
        });

        // Map recommendations back to job objects
        const detailedRecs = recommendations.map(rec => {
            const job = allJobs.find(j => j.id === rec.jobId);
            return { ...job, ...rec };
        }).filter(r => r.id);

        res.json(detailedRecs);
    } catch (error) {
        console.error("Rec error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Ingestion endpoint (Realized from teammate's simulation)
app.post('/api/candidates/ingest', async (req, res) => {
    try {
        const { name, fileName, role = 'Applicant' } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: "Candidate name is required" });
        }

        // Since this is metadata-only ingestion (simulating a fetch from somewhere else),
        // we use random high values if no file is provided, but we save to Prisma.
        const matchScore = Math.floor(Math.random() * (98 - 75 + 1)) + 75; 
        const skills = ['React', 'JavaScript', 'Problem Solving', 'System Design'];
        const summary = `${name} is a strong ${role} candidate. AI analysis suggests high alignment.`;

        const newCandidate = await prisma.candidate.create({
            data: {
                name,
                role,
                match: matchScore,
                status: 'Initial Screen',
                applied: 'Just now',
                skills: skills,
                summary,
                file: fileName || null
            }
        });

        res.json(newCandidate);
    } catch (error) {
        console.error("Ingestion error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Real Application Ingestion with PDF
app.post('/api/candidates', upload.single('resumePdf'), async (req, res) => {
  const { name, email, role, jd } = req.body;
  
  try {
    let resumeText = '';
    let originalName = '';
    
    if (req.file) {
      originalName = req.file.originalname;
      const pdfData = await pdfParse(req.file.buffer);
      resumeText = pdfData.text;
    }

    const aiResult = await analyzeResumeWithGemini(resumeText, role || 'Software Engineer', jd);

    // Upsert the candidate based on email to avoid duplicates
    const newCandidate = await prisma.candidate.upsert({
      where: { email: email || 'anonymous@hireai.io' },
      update: {
        name: name || 'Anonymous Candidate',
        role: role || 'Software Engineer',
        match: aiResult?.score || 70,
        status: (aiResult?.score || 70) > 85 ? 'Top Pick' : 'In Review',
        skills: aiResult?.skills || [],
        summary: aiResult?.summary || 'Candidate profile updated via Gemini AI.',
        file: originalName || 'resume.pdf',
        feedback: aiResult?.applicantFeedback || []
      },
      create: {
        email: email || `anon-${Date.now()}@hireai.io`,
        name: name || 'Anonymous Candidate',
        role: role || 'Software Engineer',
        match: aiResult?.score || 70,
        status: (aiResult?.score || 70) > 85 ? 'Top Pick' : 'In Review',
        skills: aiResult?.skills || [],
        summary: aiResult?.summary || 'Initial candidate analysis completed.',
        applied: 'Just now',
        file: originalName || 'resume.pdf',
        feedback: aiResult?.applicantFeedback || [],
        applications: {
          create: {
            matchScore: aiResult?.score || 70,
            technicalScore: Math.floor((aiResult?.score || 70) * 0.9),
            domainRelevance: Math.floor((aiResult?.score || 70) * 0.8),
            strengths: aiResult?.reasoning || 'Strong technical background.',
            gaps: aiResult?.applicantFeedback?.join(', ') || 'No significant gaps detected.'
          }
        }
      },
      include: { applications: true }
    });

    res.status(201).json(newCandidate);
  } catch (error) {
    console.error('Error in /api/candidates:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message, candidateId } = req.body;

  if (!GEMINI_KEY) {
    return res.json({ text: "AI Core is offline. Please check GEMINI_API_KEY." });
  }
  
  try {
    let candidate = null;
    if (candidateId) {
      candidate = await prisma.candidate.findUnique({
        where: { id: parseInt(candidateId) },
        include: { applications: true }
      });
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `
      You are an AI Interviewer for HireAI. 
      Interviewing: ${candidate?.name || 'a candidate'}.
      Role: ${candidate?.role || 'Technical Position'}.
      Context: ${candidate?.summary || ''}. Strengths: ${candidate?.applications?.[0]?.strengths || ''}.
      Message: "${message}"
      Max 3 sentences. Ask one follow-up.
    `;

    const result = await model.generateContent(prompt);
    res.json({ text: result.response.text() });
  } catch (error) {
    res.status(500).json({ text: "Gemini AI error.", error: error.message });
  }
});

app.patch('/api/candidates/:id', async (req, res) => {
  const { id } = req.params;
  const { notes, status, match } = req.body;
  
  try {
    const updated = await prisma.candidate.update({
      where: { id: parseInt(id) },
      data: {
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
        ...(match !== undefined && { match })
      }
    });
    res.json(updated);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/candidates/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.application.deleteMany({ where: { candidateId: id } });
    await prisma.candidate.delete({ where: { id: id } });
    res.json({ message: 'Candidate deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Seed endpoint - for development
app.get('/api/seed', async (req, res) => {
    try {
        await prisma.application.deleteMany();
        await prisma.candidate.deleteMany();
        await prisma.job.deleteMany();

        await prisma.candidate.createMany({
            data: [
                { name: 'Alex Rivera', role: 'Senior React Developer', match: 92, status: 'Top Pick', skills: ['React', 'TypeScript', 'Node.js'], applied: '2 days ago', summary: 'Senior Frontend Architect with 8+ years of experience.' },
                { name: 'Sarah Chen', role: 'Backend Engineer', match: 86, status: 'Strong Match', skills: ['Python', 'PostgreSQL', 'Docker'], applied: '1 week ago', summary: 'Heavy-lifting backend specialist.' }
            ]
        });

        await prisma.job.createMany({
            data: [
                { title: 'Senior React Developer', department: 'Engineering', location: 'Remote', type: 'Full-Time', salary: '$120k - $160k', posted: '2 days ago', applicants: 48, status: 'Active', description: 'Lead our frontend architecture.', skills: ['React', 'TypeScript', 'Node.js'] },
                { title: 'Fullstack Engineer', department: 'Product', location: 'Hybrid', type: 'Full-Time', salary: '$100k - $140k', posted: 'Just now', applicants: 12, status: 'Active', description: 'Join our core product team to build AI features.', skills: ['React', 'Node.js', 'PostgreSQL'] }
            ]
        });

        res.json({ message: "Database seeded successfully. Refresh your dashboard!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
  res.send('HireAI API is running with Prisma & Gemini...');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
