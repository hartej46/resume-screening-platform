const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { extractJDData } = require('../lib/extractor');
const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function sync() {
    console.log('--- Starting Data Synchronization ---');

    // 1. Sync Jobs
    const allJobs = await prisma.job.findMany();
    const jobs = allJobs.filter(j => !j.jdParsed);
    console.log(`Found ${jobs.length} jobs to parse...`);
    for (const job of jobs) {
        try {
            console.log(`Parsing JD for: ${job.title}...`);
            let jdParsed;
            try {
                jdParsed = await extractJDData(job.description || job.title);
            } catch (geminiErr) {
                console.warn(`! Gemini failed for job ${job.id}, trying Groq fallback...`);
                // Groq extraction logic
                const Groq = require('groq-sdk');
                const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
                const prompt = `You are a job description parser. Extract structured requirements from the JD below.
Return ONLY a valid JSON object:
{
  "required_skills": ["skill1"],
  "preferred_skills": ["skill1"],
  "min_years_experience": 0,
  "seniority_level": "intern | junior | mid | senior | lead",
  "education_requirement": "none | any_degree | bachelors | masters | phd",
  "certifications_preferred": ["cert1"],
  "location": "City, Country or Remote"
}
JD: ${job.description || job.title}`;
                
                const completion = await groq.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'llama-3.3-70b-versatile',
                    response_format: { type: 'json_object' }
                });
                jdParsed = JSON.parse(completion.choices[0].message.content);
            }

            await prisma.job.update({
                where: { id: job.id },
                data: { jdParsed }
            });
            console.log(`✓ Job ${job.id} updated`);
        } catch (e) {
            console.error(`✗ Failed job ${job.id}:`, e.message);
        }
    }

    // 2. Sync Candidates (Resume Text)
    const candidates = await prisma.candidate.findMany({ where: { resumeText: null } });
    console.log(`Found ${candidates.length} candidates to process...`);
    for (const candidate of candidates) {
        if (!candidate.file) {
            console.warn(`! Skipping candidate ${candidate.email}: No file found`);
            continue;
        }

        try {
            // Extract filename from URL (e.g., http://localhost:5001/uploads/123.pdf)
            const filename = path.basename(candidate.file);
            const filePath = path.join(__dirname, '../uploads', filename);

            if (fs.existsSync(filePath)) {
                console.log(`Extracting text from: ${filename}...`);
                const dataBuffer = fs.readFileSync(filePath);
                const pdfData = await pdf(dataBuffer);
                
                await prisma.candidate.update({
                    where: { id: candidate.id },
                    data: { resumeText: pdfData.text }
                });
                console.log(`✓ Candidate ${candidate.email} updated`);
            } else {
                console.warn(`! File not found on disk: ${filePath}`);
            }
        } catch (e) {
            console.error(`✗ Failed candidate ${candidate.email}:`, e.message);
        }
    }

    // 3. Sync Applications (Match Breakdown)
    const { calculateMatchScore } = require('../lib/scorer');
    const { extractResumeData } = require('../lib/extractor');
    
    const apps = await prisma.application.findMany({
        include: { job: true, candidate: true }
    });
    console.log(`Found ${apps.length} applications to re-calculate...`);
    
    for (const app of apps) {
        try {
            console.log(`Calculating breakdown for: ${app.candidate.email} @ ${app.job.title}...`);
            
            // 1. Get JD Data (cached or extract)
            let jdData = app.job.jdParsed;
            if (!jdData) {
                try {
                    jdData = await extractJDData(app.job.description || app.job.title);
                } catch (e) {
                    console.warn(`! Fallback to manual JD extraction for Job ${app.job.id}`);
                    jdData = { required_skills: app.job.skills || [], min_years_experience: 0, education_requirement: 'any_degree' };
                }
            }

            // 2. Get Resume Data
            let resumeData;
            try {
                resumeData = await extractResumeData(app.candidate.resumeText || app.candidate.summary || "No resume data");
            } catch (e) {
                console.warn(`! Fallback to manual resume extraction for ${app.candidate.email}`);
                resumeData = { skills: app.candidate.skills || [], years_experience: 0, education: [] };
            }

            // 3. Calculate
            const scoringResult = calculateMatchScore(
                { ...resumeData, legacySkills: app.candidate.skills }, 
                { ...jdData, legacySkills: app.job.skills }, 
                0.7
            );
            
            await prisma.application.update({
                where: { id: app.id },
                data: {
                    matchScore: scoringResult.overall,
                    matchBreakdown: scoringResult.breakdown
                }
            });
            console.log(`✓ Application ${app.id} updated`);
        } catch (e) {
            console.error(`✗ Failed application ${app.id}:`, e.message);
        }
    }

    console.log('--- Sync Complete ---');
    process.exit(0);
}

sync();
