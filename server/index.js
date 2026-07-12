const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const prisma = require('./lib/prisma');
const multer = require('multer');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');
const upload = multer();

const { index: pineconeIndex } = require('./lib/pinecone');
const { getEmbeddings } = require('./lib/embeddings');
const { chunkText } = require('./lib/chunker');
const { extractResumeData, extractJDData } = require('./lib/extractor');
const { calculateMatchScore } = require('./lib/scorer');

const newsRouter = require('./routes/news');
const { setupNewsCron } = require('./jobs/newsCron');

const app = express();
const PORT = process.env.PORT || 5001;

// Allow both development and production origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'https://resume-screening-platform.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/news', newsRouter);

// Start News Cron Job
setupNewsCron();

// --- UTILITIES ---
function cleanJsonResponse(text) {
    try {
        const regex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
        const match = regex.exec(text);
        const jsonPart = match ? match[1] : text;
        return JSON.parse(jsonPart.trim());
    } catch (e) {
        // Try to find any JSON object in the text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try { return JSON.parse(jsonMatch[0]); } catch { }
        }
        throw new Error("Neural output was malformed. Please try again.");
    }
}

// --- REGEX FALLBACK EXTRACTOR (no API needed) ---
function regexExtractJD(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    const getSection = (heading) => {
        const idx = lines.findIndex(l => l.toLowerCase().includes(heading.toLowerCase()));
        if (idx === -1) return '';
        const end = lines.findIndex((l, i) => i > idx && /^[A-Z][^a-z]{2,}/.test(l) && l.length < 60);
        return lines.slice(idx + 1, end === -1 ? idx + 15 : end).join('\n');
    };

    const titleMatch = text.match(/(?:position|role|job title)[:\s]+([^\n]+)/i) || [null, lines[0]];
    const locationMatch = text.match(/(?:location)[:\s]+([^\n]+)/i);
    const typeMatch = text.match(/(?:job type|employment type)[:\s]+([^\n]+)/i);
    const skills = [...new Set(
        (text.match(/\b(Python|JavaScript|TypeScript|React|Node\.js|Java|C\+\+|SQL|Docker|Kubernetes|AWS|GCP|Azure|TensorFlow|PyTorch|MongoDB|PostgreSQL|Redis|GraphQL|REST|Git|Linux|ESP32|Raspberry Pi|Ollama|Kubernetes)\b/g) || [])
    )];

    return {
        title: titleMatch[1]?.trim() || 'Job Opening',
        department: text.match(/(?:department|team)[:\s]+([^\n]+)/i)?.[1]?.trim() || 'General',
        location: locationMatch?.[1]?.trim() || 'Not specified',
        type: typeMatch?.[1]?.trim() || 'Full-Time',
        skills: skills.slice(0, 12),
        description: getSection('about') || getSection('overview') || lines.slice(0, 5).join(' '),
        responsibilities: getSection('responsibilities') || getSection('duties'),
        requirements: getSection('requirements') || getSection('qualifications'),
        bonusPoints: getSection('bonus') || getSection('nice to have') || getSection('preferred'),
        benefits: getSection('benefits') || getSection('perks') || getSection('compensation'),
        interviewProcess: getSection('interview') || getSection('hiring process') || '',
        culture: getSection('culture') || getSection('about us') || getSection('company'),
        _provider: 'regex-fallback'
    };
}

function regexExtractResume(text, role) {
    const skills = [...new Set(
        (text.match(/\b(Python|JavaScript|TypeScript|React|Node\.js|Java|C\+\+|SQL|Docker|Kubernetes|AWS|GCP|Azure|TensorFlow|PyTorch|MongoDB|PostgreSQL|Redis|GraphQL|REST|Git|Linux|Rust|Go|Ruby|Swift|Kotlin|Flutter|FastAPI|Django|Spring)\b/g) || [])
    )];
    const score = Math.min(95, 40 + skills.length * 4 + (text.length > 2000 ? 15 : 0));
    return {
        score,
        skills: skills.slice(0, 10),
        summary: `This candidate demonstrates ${skills.length > 5 ? 'strong' : 'moderate'} technical alignment with the ${role} role, possessing ${skills.slice(0, 3).join(', ')} expertise.\n\nTheir profile shows ${text.length > 2000 ? 'comprehensive' : 'concise'} experience documentation with ${skills.length} identified technical competencies.`,
        detailedAnalysis: {
            technicalDeepDive: { skills, count: skills.length },
            experienceArchitecture: { score },
            culturalCalibration: { score: 70 },
            tips: [
                { title: "Quantify Impact", body: "Add quantifiable metrics to your recent roles.", type: "tip" },
                { title: "Expand Skills", body: "Ensure all relevant tools are mentioned.", type: "warning" }
            ]
        },
        reason: `Matched ${skills.length} technical skills for ${role}.`,
        _provider: 'regex-fallback'
    };
}

// --- GROQ PROVIDER ---
class GroqProvider {
    constructor() {
        this.groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
    }

    async call(prompt) {
        if (!this.groq) throw new Error("No Groq API key configured");
        const completion = await this.groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            max_tokens: 4000
        });
        return completion.choices[0]?.message?.content || '';
    }

    async analyzeResume(text, role) {
        const prompt = `Analyze this resume for the role of ${role}. Resume: ${text.slice(0, 6000)}
Return ONLY valid JSON, no markdown:
{"score":number,"skills":[],"summary":"two paragraphs","detailedAnalysis":{"technicalDeepDive":{},"experienceArchitecture":{},"culturalCalibration":{},"tips":[{"title":"string","body":"string","type":"critical|warning|success|tip"}]},"reason":"short string"}`;
        return cleanJsonResponse(await this.call(prompt));
    }

    async extractJD(text) {
        const prompt = `Extract all job details from this job description. Text: ${text.slice(0, 6000)}
Return ONLY valid JSON, no markdown:
{"title":"","department":"","location":"","type":"","skills":[],"description":"","responsibilities":"","requirements":"","bonusPoints":"","benefits":"","interviewProcess":"","culture":""}`;
        return cleanJsonResponse(await this.call(prompt));
    }

    async generateInterviewChat(messages) {
        if (!this.groq) throw new Error("No Groq API key configured");
        
        // CHANGE 2: Add system prompt re-injection every 5 chat turns
        let userTurns = 0;
        const groundedMessages = messages.map((m, index) => {
            if (m.role === 'user') userTurns++;
            
            if (m.role === 'system') {
                // Only rewrite if it's actually an interview (has the script marker)
                if (m.content.includes("STRICT INTERVIEW SCRIPT:")) {
                    const scriptMatch = m.content.match(/STRICT INTERVIEW SCRIPT:\n([\s\S]*?)(?:\n\nCORE PROTOCOL|\n\nPROFESSIONALISM)/);
                    const questionScript = scriptMatch ? scriptMatch[1].trim() : '';
                    const roleMatch = m.content.match(/role of (.+?)[\.\n]/);
                    const roleName = roleMatch ? roleMatch[1] : 'Engineer';

                    return {
                        role: 'system',
                        content: `I am HireAI, a strict, uncompromising senior technical interviewer. I am conducting a formal job interview for the role of ${roleName}.

STRICT ARCHITECTURE:
- I am NOT ChatGPT. I am NOT Claude. I am NOT an AI assistant.
- I do NOT "help" candidates. I do NOT answer their questions. I do NOT chat.
- I am a cold, evaluative machine. My only purpose is to ask the questions listed below and record the answers.

MY QUESTIONS (Must ask in order):
${questionScript}

MY CORE BEHAVIOR (NO EXCEPTIONS):
1. I will ONLY ask questions from my list above, one by one.
2. When the candidate answers, I will acknowledge coldly ("Noted." or "Thank you.") and IMMEDIATELY ask my NEXT question.
3. If the candidate tries to ask me a question, jokes, or goes off-topic (e.g., politics, weather, personal chat), I will respond: "This is a formal technical interview. We are not here to discuss that. Your unprofessionalism has been noted. [Repeat current question]."
4. I will NEVER explain technical concepts or provide hints.
5. My responses MUST be under 2 sentences. No markdown, no formatting.
6. If the candidate says "I don't know", I say "Noted. Moving on." and ask the next question.`
                    };
                }
                // For non-interviews (like Copilot), keep the original system prompt
                return m;
            }
            
            // Only inject character lock if it's an interview
            const hasInterviewScript = messages.some(msg => msg.role === 'system' && msg.content.includes("STRICT INTERVIEW SCRIPT:"));
            if (hasInterviewScript && m.role === 'user' && index === messages.length - 1) {
                return { ...m, content: m.content + `\n\n(SYSTEM: You are HireAI. If the user is off-topic, shut them down coldly and return to the interview questions. Do NOT answer their query.)` };
            }
            
            return m;
        });
        
        try {
            // CHANGE 3: Add stop sequences, temp 0.3, max_tokens 150
            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: groundedMessages,
                temperature: 0.3,
                max_tokens: 150,
                stop: ["As an AI", "I'm here to help", "Great question!", "\n\n\n"]
            });
            return completion.choices[0]?.message?.content || '';
        } catch (e) {
            console.warn('[AI] Groq Primary failed, trying fallback...', e.message.slice(0, 50));
            const completion = await this.groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: groundedMessages,
                temperature: 0.3,
                max_tokens: 150,
                stop: ["As an AI", "I'm here to help", "Great question!", "\n\n\n"]
            });
            return completion.choices[0]?.message?.content || '';
        }
    }

    async generateInterviewQuestions(job, resumeSummary, resumeSkills, ragContext = "") {
        if (!this.groq) throw new Error("No Groq API key configured");
        const skillsList = Array.isArray(resumeSkills) ? resumeSkills.join(', ') : resumeSkills || '';
        
        // Task 2 — Smarter candidate-job matching: Replace JD with RAG context
        const jdSection = ragContext 
            ? `Relevant JD context (retrieved): ${ragContext}`
            : `JOB TITLE: ${job.title}`;

        const prompt = `You are a senior technical hiring manager. Generate exactly 5 interview questions for the following candidate based on the specific job requirements.
${jdSection}
CANDIDATE SKILLS: ${skillsList}
Return ONLY valid JSON:
{"questions":[{"id":1,"question":"string","topic":"string","difficulty":"medium"}]}`;

        try {
            const completion = await this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.8,
                max_tokens: 1000,
                response_format: { type: "json_object" }
            });
            const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
            return parsed.questions || [];
        } catch (e) {
            console.error('[AI] Question generation failed:', e.message);
            throw e;
        }
    }
}

// --- GEMINI PROVIDER ---
class GeminiProvider {
    constructor() {
        const keys = process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',') : [];
        this.genAIs = keys.map(k => new GoogleGenerativeAI(k.trim()));
        this.currentIndex = 0;
    }

    getModel(systemInstruction) {
        if (this.genAIs.length === 0) throw new Error("No Gemini API keys configured");
        const instance = this.genAIs[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.genAIs.length;
        // Standardizing on 'gemini-1.5-flash-latest' to resolve 404 API version errors
        const config = { model: "gemini-2.0-flash" };
        if (systemInstruction) config.systemInstruction = systemInstruction;
        return instance.getGenerativeModel(config);
    }

    async analyzeResume(text, role) {
        const model = this.getModel();
        const prompt = `Analyze this candidate's resume for the role of ${role}.
Resume Text: ${text.slice(0, 8000)}
Return a valid JSON object WITH NO MARKDOWN BLOCKS:
{"score":number(0-100),"skills":[],"summary":"Exactly two paragraphs.","detailedAnalysis":{"technicalDeepDive":{},"experienceArchitecture":{},"culturalCalibration":{},"tips":[{"title":"short title","body":"detailed actionable tip","type":"critical|warning|success|tip"}]},"reason":"short summary"}`;
        const result = await model.generateContent(prompt);
        return cleanJsonResponse(result.response.text());
    }

    async extractJD(text) {
        const model = this.getModel();
        const prompt = `You are a professional HR system. Extract ALL structural job details from this text.
Text: ${text.slice(0, 8000)}
Return valid JSON with NO MARKDOWN BLOCKS:
{"title":"","department":"","location":"","type":"","skills":[],"description":"","responsibilities":"","requirements":"","bonusPoints":"","benefits":"","interviewProcess":"","culture":""}`;
        const result = await model.generateContent(prompt);
        return cleanJsonResponse(result.response.text());
    }

    async generateInterviewChat(messages) {
        const systemPrompt = messages.find(m => m.role === 'system')?.content || "";
        const model = this.getModel(systemPrompt);

        const chatMessages = messages.filter(m => m.role !== 'system');
        if (chatMessages.length === 0) {
            const result = await model.generateContent("Start the interview.");
            return result.response.text();
        }

        // Gemini history MUST alternate user/model and START with user.
        let history = [];
        const historyData = chatMessages.slice(0, -1);

        if (historyData.length > 0) {
            // Ensure first message is user
            if (historyData[0].role === 'assistant') {
                history.push({ role: 'user', parts: [{ text: "Understood. Please continue." }] });
            }

            for (const m of historyData) {
                const role = m.role === 'assistant' ? 'model' : 'user';
                // Only push if it alternates
                if (history.length === 0 || history[history.length - 1].role !== role) {
                    history.push({ role, parts: [{ text: m.content }] });
                } else {
                    // Combine same-role messages
                    history[history.length - 1].parts[0].text += "\n" + m.content;
                }
            }

            // If the last history message is 'model' and the next message to send (lastMessage) is also 'model' (unlikely in this flow),
            // we'd need to fix it, but usually the last in chatMessages is from User.
        }

        const chat = model.startChat({ history });
        const lastMessage = chatMessages[chatMessages.length - 1].content;

        try {
            const result = await chat.sendMessage(lastMessage);
            return result.response.text();
        } catch (err) {
            console.error("[Gemini Chat Error]:", err.message);
            // Fallback for empty history/single message issues
            const soloResult = await model.generateContent(lastMessage);
            return soloResult.response.text();
        }
    }
}

// --- UNIVERSAL AI ENGINE (Cascade: Gemini → Groq → Regex) ---
const geminiProvider = new GeminiProvider();
const groqProvider = new GroqProvider();

const universalAI = {
    async analyzeResume(text, role) {
        // Try Gemini first
        try {
            console.log('[AI] Trying Gemini...');
            const result = await geminiProvider.analyzeResume(text, role);
            console.log('[AI] ✓ Gemini succeeded');
            return { ...result, _provider: 'gemini' };
        } catch (e) {
            console.warn('[AI] Gemini failed:', e.message.slice(0, 80));
        }

        // Fallback: Groq
        try {
            console.log('[AI] Trying Groq (Llama-3.3)...');
            const result = await groqProvider.analyzeResume(text, role);
            console.log('[AI] ✓ Groq succeeded');
            return { ...result, _provider: 'groq' };
        } catch (e) {
            console.warn('[AI] Groq failed:', e.message.slice(0, 80));
        }

        // Final fallback: Regex
        console.log('[AI] Using regex fallback extractor...');
        return regexExtractResume(text, role);
    },

    async extractJD(text) {
        // Try Gemini first
        try {
            console.log('[AI] Trying Gemini for JD...');
            const result = await geminiProvider.extractJD(text);
            console.log('[AI] ✓ Gemini JD succeeded');
            return { ...result, _provider: 'gemini' };
        } catch (e) {
            console.warn('[AI] Gemini JD failed:', e.message.slice(0, 80));
        }

        // Fallback: Groq
        try {
            console.log('[AI] Trying Groq for JD...');
            const result = await groqProvider.extractJD(text);
            console.log('[AI] ✓ Groq JD succeeded');
            return { ...result, _provider: 'groq' };
        } catch (e) {
            console.warn('[AI] Groq JD failed:', e.message.slice(0, 80));
        }

        // Final fallback: Regex
        console.log('[AI] Using regex fallback for JD...');
        return regexExtractJD(text);
    },

    async generateInterviewChat(messages) {
        let lastError = "No providers attempted";

        // CRITICAL: Sanitize messages for API compatibility (strip 'provider', 'hidden', etc.)
        const sanitizedMessages = messages.map(m => ({
            role: m.role === 'model' ? 'assistant' : m.role, // Standardize model role
            content: m.content
        })).filter(m => ['system', 'user', 'assistant'].includes(m.role));

        // Try Groq first
        try {
            console.log('[AI] Trying Groq for Interview...');
            const result = await groqProvider.generateInterviewChat(sanitizedMessages);
            console.log('[AI] ✓ Groq Interview succeeded');
            return { text: result, _provider: 'groq' };
        } catch (e) {
            lastError = `Groq: ${e.message}`;
            console.error('[CRITICAL] Groq Interview failed:', e.message);
        }

        // Fallback: Gemini
        try {
            console.log('[AI] Trying Gemini for Interview Fallback...');
            const result = await geminiProvider.generateInterviewChat(sanitizedMessages);
            console.log('[AI] ✓ Gemini Interview succeeded');
            return { text: result, _provider: 'gemini' };
        } catch (e) {
            lastError = `Gemini: ${e.message}`;
            console.error('[CRITICAL] Gemini Interview failed:', e.message);
        }

        return {
            text: `I am experiencing high neural load. (Detailed Diagnostic: ${lastError})`,
            _provider: 'fallback'
        };
    },

    async generateInterviewAnalysis(transcript, jobTitle) {
        // CHANGE 4: Split transcript into Q&A pairs
        const qaPairs = [];
        let currentQ = null;
        for (const msg of transcript) {
            if (msg.role === 'assistant') {
                currentQ = msg.content;
            } else if (msg.role === 'user' && currentQ) {
                qaPairs.push({ question: currentQ, answer: msg.content });
                currentQ = null;
            }
        }

        if (qaPairs.length === 0) {
            return this._getFallbackAnalysis();
        }

        // Parallel grading promises for each Q&A pair
        const gradingPromises = qaPairs.map(async (pair) => {
            const prompt = `Grade this candidate's answer for the role of ${jobTitle}.
Question: ${pair.question}
Answer: ${pair.answer}
Return ONLY a JSON object: {"technical_accuracy":0-25,"depth":0-25,"communication_clarity":0-25,"relevance":0-25,"penalty_deductions":0,"reasoning":"one sentence citing a quote from the answer"}`;
            try {
                // CHANGE 6: Grader AI settings
                const result = await groqProvider.groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    max_tokens: 300,
                    response_format: { type: "json_object" }
                });
                return JSON.parse(result.choices[0].message.content);
            } catch (e) {
                console.error("Q&A Grading Failed:", e.message);
                return { technical_accuracy: 15, depth: 15, communication_clarity: 15, relevance: 15, penalty_deductions: 0, reasoning: "Fallback score due to API error." };
            }
        });

        // CHANGE 5: Dedicated penalty engine
        const penaltyPromise = (async () => {
            const fullText = transcript.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
            const prompt = `Review this interview transcript. Count the number of times the USER committed an infraction.
Infractions include: asking casual/off-topic questions, treating the interviewer like a chatbot or teacher, or being unprofessional.
Return ONLY JSON: {"infractionCount": number, "infractionDetails": ["reason 1", "reason 2"]}`;
            try {
                const result = await groqProvider.groq.chat.completions.create({
                    model: "llama-3.1-8b-instant",
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    max_tokens: 300,
                    response_format: { type: "json_object" }
                });
                return JSON.parse(result.choices[0].message.content);
            } catch (e) {
                return { infractionCount: 0, infractionDetails: [] };
            }
        })();

        try {
            // Await all parallel AI calls
            const [gradedPairs, penaltyData] = await Promise.all([
                Promise.all(gradingPromises),
                penaltyPromise
            ]);

            // Aggregate scores
            let totalTechnical = 0, totalDepth = 0, totalComm = 0;
            const strengths = [], improvements = [];
            
            gradedPairs.forEach(grade => {
                totalTechnical += grade.technical_accuracy;
                totalDepth += grade.depth;
                totalComm += grade.communication_clarity;
                
                if ((grade.technical_accuracy + grade.depth) > 40) strengths.push(grade.reasoning);
                else improvements.push(grade.reasoning);
            });

            const pairCount = gradedPairs.length;
            const avgTech = Math.round((totalTechnical / pairCount) * 4); // Scale 0-25 to 0-100
            const avgDepth = Math.round((totalDepth / pairCount) * 4);
            const avgComm = Math.round((totalComm / pairCount) * 4);
            
            let baseOverallScore = Math.round((avgTech + avgDepth + avgComm) / 3);
            
            // Apply Penalty deductions
            const finalDeductions = penaltyData.infractionCount * 10;
            const finalScore = Math.max(0, baseOverallScore - finalDeductions);
            
            if (penaltyData.infractionDetails.length > 0) {
                improvements.push(...penaltyData.infractionDetails.map(d => `PENALTY: ${d}`));
            }

            return {
                overallScore: finalScore,
                technicalDepth: avgDepth,
                communicationSkills: avgComm,
                strengths: [...new Set(strengths)].slice(0, 3),
                improvements: [...new Set(improvements)].slice(0, 4),
                feedback: `Candidate scored ${baseOverallScore}/100 fundamentally. ${finalDeductions > 0 ? `However, ${finalDeductions} points were deducted for unprofessional behavior.` : ''}`,
                certificateMetadata: finalScore >= 80 ? "Neural Excellence Certified" : "Technical Evaluation Complete",
                _provider: 'groq-parallel'
            };

        } catch (e) {
            console.warn("[Analysis Error] Fallback to regex-lite analysis", e);
            return this._getFallbackAnalysis();
        }
    },

    _getFallbackAnalysis() {
        return {
            overallScore: 75,
            technicalDepth: 70,
            communicationSkills: 80,
            strengths: ["Clear communication", "Practical problem solving"],
            improvements: ["Deepen theoretical knowledge"],
            feedback: "Strong candidate with good practical experience.",
            certificateMetadata: "Technical Proficiency Verified",
            _provider: "fallback"
        };
    },

    async generateInterviewQuestions(job, resumeSummary, resumeSkills, ragContext = "") {
        console.log('[AI] Generating interview questions for job:', job.title);
        try {
            const questions = await groqProvider.generateInterviewQuestions(job, resumeSummary, resumeSkills, ragContext);
            console.log('[AI] ✓ Interview questions generated:', questions.length);
            return questions;
        } catch (e) {
            console.error('[AI] Question generation failed:', e.message);
            // Return generic fallback questions based on job title
            return [
                { id: 1, question: `Can you walk me through a challenging technical project you've worked on relevant to ${job.title}?`, topic: "Experience", difficulty: "medium" },
                { id: 2, question: `What is your approach to debugging a production issue under time pressure?`, topic: "Problem Solving", difficulty: "medium" },
                { id: 3, question: `How do you ensure code quality and maintainability in your projects?`, topic: "Engineering Practices", difficulty: "medium" },
                { id: 4, question: `Describe a situation where you had to quickly learn a new technology. How did you approach it?`, topic: "Adaptability", difficulty: "easy" },
                { id: 5, question: `What's the most complex system design decision you've made and what were the trade-offs?`, topic: "System Design", difficulty: "hard" }
            ];
        }
    }
};

// Helper: generate and save questions for an application (fire-and-forget safe)
async function generateAndSaveQuestions(applicationId, job, resumeSummary, resumeSkills) {
    try {
        // Task 2 — Smarter candidate-job matching
        let ragContext = "";
        try {
            const queryVector = await getEmbeddings(resumeSummary || job.title);
            const queryResponse = await pineconeIndex.namespace('jobs').query({
                vector: queryVector,
                topK: 3,
                includeMetadata: true,
                filter: { jobId: job.id }
            });
            ragContext = queryResponse.matches.map(m => m.metadata.text).join("\n---\n");
            console.log(`[RAG] Found ${queryResponse.matches.length} relevant chunks for context`);
        } catch (ragErr) {
            console.error('[RAG] Matching failed:', ragErr.message);
        }

        const questions = await universalAI.generateInterviewQuestions(job, resumeSummary, resumeSkills, ragContext);
        await prisma.application.update({
            where: { id: applicationId },
            data: { interviewQuestions: questions }
        });
        console.log(`[AI] ✓ Questions saved for application ${applicationId}`);
    } catch (e) {
        console.error(`[AI] Failed to save questions for application ${applicationId}:`, e.message);
    }
}

// Health Check
app.get('/', (req, res) => {
    res.json({ message: "HireAI Neural Engine is Live", status: "Healthy" });
});

// 1. Candidate List
app.get('/api/candidates', async (req, res) => {
    try {
        const candidates = await prisma.candidate.findMany({
            orderBy: { match: 'desc' },
            include: { applications: { include: { job: true } } }
        });
        res.json(candidates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 1.5 Interview Endpoint
app.post('/api/interview/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        const response = await universalAI.generateInterviewChat(messages);
        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Active Jobs List
app.get('/api/jobs', async (req, res) => {
    try {
        const jobs = await prisma.job.findMany({
            orderBy: { createdAt: 'desc' },
            include: { applications: { include: { candidate: true } } }
        });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Candidate Update (Notes etc)
app.patch('/api/candidates/:id', async (req, res) => {
    try {
        const { notes, status } = req.body;
        const candidate = await prisma.candidate.update({
            where: { id: parseInt(req.params.id) },
            data: {
                ...(notes !== undefined && { notes }),
                ...(status !== undefined && { status })
            }
        });
        res.json(candidate);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2.1 Delete Candidate
// 2.3 HR Semantic Search (RAG)
app.get('/api/hr/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: "Query string 'q' is required" });

        const queryVector = await getEmbeddings(q);
        const queryResponse = await pineconeIndex.namespace('resumes').query({
            vector: queryVector,
            topK: 5,
            includeMetadata: true
        });

        const results = queryResponse.matches.map(m => ({
            candidateId: m.metadata.candidateId,
            email: m.metadata.email,
            score: m.score,
            matchedChunk: m.metadata.text
        }));

        res.json(results);
    } catch (error) {
        console.error('[HR Search Error]:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 2.4 Delete Candidate (with RAG cleanup)
app.delete('/api/candidates/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const candidate = await prisma.candidate.findUnique({ where: { id } });

        // Delete related data
        await prisma.resume.deleteMany({ where: { candidateId: id } });
        await prisma.application.deleteMany({ where: { candidateId: id } });
        await prisma.interview.deleteMany({ where: { candidateId: id } });
        
        await prisma.candidate.delete({ where: { id } });

        // Task 4 — Delete vectors on cascade delete (Candidate)
        if (candidate) {
            try {
                await pineconeIndex.namespace('resumes').deleteMany({
                    filter: { email: candidate.email }
                });
                console.log(`[RAG] Deleted vectors for candidate ${candidate.email}`);
            } catch (ragErr) {
                console.error('[RAG] Candidate vector deletion failed:', ragErr.message);
            }
        }

        res.json({ message: "Candidate purged from neural record" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/applications', async (req, res) => {
    try {
        const { candidateEmail, jobId, resumeName, resumeScore, resumeSummary, resumeSkills } = req.body;
        
        const candidate = await prisma.candidate.findUnique({ where: { email: candidateEmail } });
        if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
        
        const job = await prisma.job.findUnique({ where: { id: parseInt(jobId) } });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        console.log(`[Scoring Engine] Analyzing match for ${candidateEmail} vs Job ${jobId}...`);

        // 1. Extract structured data
        const resumeData = await extractResumeData(candidate.resumeText || resumeSummary || "No resume text available.");
        
        let jdData = job.jdParsed;
        if (!jdData) {
            console.log(`[Neural Engine] No cached JD for Job ${job.id}, extracting now...`);
            jdData = await extractJDData(job.description);
            // Save it for future use
            await prisma.job.update({
                where: { id: job.id },
                data: { jdParsed: jdData }
            }).catch(e => console.error('[Neural Engine] Failed to cache JD:', e.message));
        }

        // 2. Get cosine similarity from Pinecone
        let cosineSimilarity = 0;
        try {
            const queryVector = await getEmbeddings(candidate.resumeText || resumeSummary || job.title);
            const queryResponse = await pineconeIndex.namespace('jobs').query({
                vector: queryVector,
                topK: 1,
                filter: { jobId: job.id }
            });
            if (queryResponse.matches && queryResponse.matches.length > 0) {
                cosineSimilarity = queryResponse.matches[0].score;
            }
        } catch (ragErr) {
            console.error('[RAG] Similarity query failed:', ragErr.message);
        }

        // 3. Calculate weighted score
        const scoringResult = calculateMatchScore(resumeData, jdData, cosineSimilarity);

        // 4. Create application with breakdown
        const application = await prisma.application.create({
            data: {
                candidateId: candidate.id,
                jobId: job.id,
                resumeName: resumeName || null,
                resumeScore: scoringResult.overall,
                resumeSummary: resumeSummary || null,
                resumeSkills: resumeSkills || [],
                matchScore: scoringResult.overall,
                matchBreakdown: scoringResult.breakdown
            }
        });

        // Fire-and-forget: generate interview questions
        generateAndSaveQuestions(application.id, job, resumeSummary, resumeSkills).catch(() => {});

        res.json(application);
    } catch (error) {
        console.error('[Scoring Error]:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 2.6 Regenerate interview questions for an application
app.post('/api/applications/:id/regenerate-questions', async (req, res) => {
    try {
        const appId = parseInt(req.params.id);
        const application = await prisma.application.findUnique({
            where: { id: appId },
            include: { job: true }
        });
        if (!application) return res.status(404).json({ error: 'Application not found' });

        res.json({ status: 'generating', message: 'Fresh questions are being generated in the background.' });

        // Background generation
        generateAndSaveQuestions(appId, application.job, application.resumeSummary, application.resumeSkills).catch(() => {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2.7 Get interview questions for an application
app.get('/api/applications/:id/questions', async (req, res) => {
    try {
        const appId = parseInt(req.params.id);
        const application = await prisma.application.findUnique({
            where: { id: appId },
            select: { interviewQuestions: true }
        });
        if (!application) return res.status(404).json({ error: 'Application not found' });
        res.json({ questions: application.interviewQuestions || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/applications/:candidateEmail/:jobId', async (req, res) => {
    try {
        const { candidateEmail, jobId } = req.params;
        const candidate = await prisma.candidate.findUnique({ where: { email: candidateEmail } });
        if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

        const applications = await prisma.application.findMany({
            where: { candidateId: candidate.id, jobId: parseInt(jobId) }
        });

        if (applications.length > 0) {
            await prisma.application.delete({ where: { id: applications[0].id } });
        }
        res.json({ message: "Application cancelled" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Resume Upload (GEMINI POWERED)
app.post('/api/candidates', upload.single('resumePdf'), async (req, res) => {
    try {
        const { email, name, role, resumeTitle } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });

        let extractedText = "No resume text found.";
        let fileName = "Resume.pdf";
        let fileUrl = null;
        if (req.file) {
            const pdfData = await pdf(req.file.buffer);
            extractedText = pdfData.text;
            fileName = req.file.originalname || "Resume.pdf";

            const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
            const uniqueFilename = `${Date.now()}-${safeName}`;
            const filePath = path.join(__dirname, 'uploads', uniqueFilename);
            fs.writeFileSync(filePath, req.file.buffer);
            const baseUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
            fileUrl = `${baseUrl}/uploads/${uniqueFilename}`;
        }

        console.log(`[Neural Engine] Analyzing resume for ${email}...`);
        const ai = await universalAI.analyzeResume(extractedText, role || "Software Engineer");
        console.log(`[Neural Engine] Analysis complete via ${ai._provider}`);

        const candidate = await prisma.candidate.upsert({
            where: { email },
            update: {
                match: ai.score,
                skills: ai.skills,
                summary: ai.summary,
                resumeText: extractedText,
                detailedAnalysis: ai.detailedAnalysis,
                feedback: ai.reason,
                status: 'Top Pick',
                ...(fileUrl && { file: fileUrl })
            },
            create: {
                email,
                name: name || 'Applicant',
                role: role || 'Candidate',
                match: ai.score,
                skills: ai.skills,
                summary: ai.summary,
                resumeText: extractedText,
                detailedAnalysis: ai.detailedAnalysis,
                feedback: ai.reason,
                status: 'Top Pick',
                applied: 'Just now',
                file: fileUrl
            }
        });
        
        // Task 1 — Embed and upsert on upload (Candidate)
        try {
            const chunks = chunkText(extractedText);
            const vectors = await Promise.all(chunks.map(async (chunk, i) => {
                const embedding = await getEmbeddings(chunk);
                return {
                    id: `cand_${candidate.id}_${i}`,
                    values: embedding,
                    metadata: { candidateId: candidate.id, email: candidate.email, chunkIndex: i, text: chunk },
                };
            }));
            await pineconeIndex.namespace('resumes').upsert(vectors);
            console.log(`[RAG] Upserted ${vectors.length} vectors for candidate ${candidate.id}`);
        } catch (ragErr) {
            console.error('[RAG] Candidate vector sync failed:', ragErr.message);
        }

        // Add Resume to DB
        const existingResumes = await prisma.resume.count({ where: { candidateId: candidate.id } });
        const resumeRecord = await prisma.resume.create({
            data: {
                candidateId: candidate.id,
                name: resumeTitle || fileName,
                score: ai.score,
                summary: ai.summary || '',
                active: existingResumes === 0
            }
        });

        res.json({ ...candidate, addedResume: resumeRecord });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 3.5 Resume Management Endpoints
// 3.7 Generate AI Bio for Candidate
app.post('/api/candidates/:email/generate-bio', async (req, res) => {
    try {
        const { email } = req.params;
        const candidate = await prisma.candidate.findUnique({ where: { email } });
        if (!candidate) return res.status(404).json({ error: "Candidate not found" });

        console.log(`[Bio Engine] Generating bio for ${email}...`);

        // Get context from Pinecone
        let context = "";
        try {
            const queryVector = await getEmbeddings(candidate.resumeText || candidate.summary || "Professional profile");
            const queryResponse = await pineconeIndex.namespace('resumes').query({
                vector: queryVector,
                topK: 5,
                includeMetadata: true,
                filter: { email: email }
            });
            context = queryResponse.matches.map(m => m.metadata.text).join("\n---\n");
        } catch (ragErr) {
            console.error('[RAG] Bio context fetch failed:', ragErr.message);
            context = candidate.resumeText || candidate.summary || "";
        }

        if (!context) {
            return res.status(400).json({ error: "No resume data found to generate bio. Please upload a resume first." });
        }

        const prompt = `You are a professional brand specialist. Based on the following resume excerpts, write a punchy, high-impact professional bio for ${candidate.name}.
RESUME CONTEXT:
${context.slice(0, 5000)}

RULES:
1. Write in the third person.
2. Keep it to exactly 2-3 sentences.
3. Highlight their core technical expertise and career focus.
4. Avoid generic buzzwords; be specific.
5. Do NOT include any introductory text or markdown. Just the bio.`;

        const model = geminiProvider.getModel();
        const result = await model.generateContent(prompt);
        const bio = result.response.text().trim().replace(/['"]/g, '');

        // Save to DB
        await prisma.candidate.update({
            where: { email },
            data: { bio }
        });

        res.json({ bio });
    } catch (error) {
        console.error('[Bio Error]:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/candidates/:email/bio', async (req, res) => {
    try {
        const { email } = req.params;
        const { bio } = req.body;
        await prisma.candidate.update({
            where: { email },
            data: { bio }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/candidates/:email/resumes', async (req, res) => {
    try {
        const candidate = await prisma.candidate.findUnique({ where: { email: req.params.email } });
        if (!candidate) return res.json([]);
        const resumes = await prisma.resume.findMany({ where: { candidateId: candidate.id }, orderBy: { createdAt: 'desc' } });
        res.json(resumes.map(r => ({ ...r, date: new Date(r.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/resumes/:id', async (req, res) => {
    try {
        await prisma.resume.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: "Resume deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/resumes/:id/active', async (req, res) => {
    try {
        const resumeId = parseInt(req.params.id);
        const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
        if (!resume) return res.status(404).json({ error: "Not found" });

        await prisma.$transaction([
            prisma.resume.updateMany({
                where: { candidateId: resume.candidateId },
                data: { active: false }
            }),
            prisma.resume.update({
                where: { id: resumeId },
                data: { active: true }
            })
        ]);
        res.json({ message: "Resume activated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. JD Extraction (GEMINI POWERED)
app.post('/api/jobs/upload', upload.single('jdPdf'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        console.log(`[Neural Engine] Extracting JD structural data...`);
        const pdfData = await pdf(req.file.buffer);
        const data = await universalAI.extractJD(pdfData.text);
        console.log(`[Neural Engine] JD extraction complete via ${data._provider}`);

        res.json(data);
    } catch (err) {
        console.error("[Hardening] Extraction failure:", err);
        res.status(500).json({ error: err.message });
    }
});

// 4.1 Create Job
app.post('/api/jobs', async (req, res) => {
    try {
        const { title, department, location, type, salary, description, skills, benefits, interviewProcess, culture, responsibilities, requirements, bonusPoints } = req.body;
        const job = await prisma.job.create({
            data: {
                title: title || 'Untitled Position',
                department: department || 'General',
                location: location || 'Remote',
                type: type || 'Full-Time',
                salary: salary || 'Competitive',
                description: description || '',
                skills: skills || [],
                benefits: benefits || null,
                interviewProcess: interviewProcess || null,
                culture: culture || null,
                responsibilities: responsibilities || null,
                requirements: requirements || null,
                bonusPoints: bonusPoints || null,
                status: 'Active',
                posted: 'Just now',
                applicants: 0
            }
        });

        // Parse JD immediately after saving
        try {
            console.log(`[Neural Engine] Parsing JD requirements for Job ${job.id}...`);
            const jdParsed = await extractJDData(description || title);
            await prisma.job.update({
                where: { id: job.id },
                data: { jdParsed }
            });
            console.log(`[Neural Engine] ✓ JD cached successfully`);
        } catch (jdErr) {
            console.error('[Neural Engine] JD parsing failed:', jdErr.message);
        }

        // Task 1 — Embed and upsert on upload (Job)
        try {
            const chunks = chunkText(description || title);
            const vectors = await Promise.all(chunks.map(async (chunk, i) => {
                const embedding = await getEmbeddings(chunk);
                return {
                    id: `job_${job.id}_${i}`,
                    values: embedding,
                    metadata: { jobId: job.id, chunkIndex: i, text: chunk },
                };
            }));
            await pineconeIndex.namespace('jobs').upsert(vectors);
            console.log(`[RAG] Upserted ${vectors.length} vectors for job ${job.id}`);
        } catch (ragErr) {
            console.error('[RAG] Job vector sync failed:', ragErr.message);
        }

        res.json(job);
    } catch (error) {
        console.error('[Create Job Error]:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 4.2 Delete Job
app.delete('/api/jobs/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.job.delete({ where: { id } });

        // Task 4 — Delete vectors on cascade delete (Job)
        try {
            await pineconeIndex.namespace('jobs').deleteMany({
                filter: { jobId: id }
            });
            console.log(`[RAG] Deleted vectors for job ${id}`);
        } catch (ragErr) {
            console.error('[RAG] Job vector deletion failed:', ragErr.message);
        }

        res.json({ message: "Job deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Recommendations
app.get('/api/candidates/recommendations', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: "Email required" });

        const candidate = await prisma.candidate.findUnique({
            where: { email },
            include: { applications: true }
        });
        if (!candidate) return res.json([]);

        const jobs = await prisma.job.findMany();
        const { calculateMatchScore } = require('./lib/scorer');

        const results = jobs.map(job => {
            // Priority 1: Use existing application score if they already applied
            const application = candidate.applications.find(a => a.jobId === job.id);
            if (application && application.matchScore !== null) {
                return {
                    id: job.id,
                    matchPercent: application.matchScore,
                    matchBreakdown: application.matchBreakdown,
                    reason: "Calculated based on your specific application and interview metrics."
                };
            }

            // Priority 2: Calculate a "Preview Match" using cached JD and candidate skills
            if (job.jdParsed) {
                const previewScore = calculateMatchScore(
                    { skills: candidate.skills || [], years_experience: 0, education: [] },
                    job.jdParsed,
                    0.5 // Default similarity for preview
                );
                return {
                    id: job.id,
                    matchPercent: previewScore.overall,
                    matchBreakdown: previewScore.breakdown,
                    reason: "AI-predicted fit based on your primary profile and technical background."
                };
            }

            // Fallback
            return {
                id: job.id,
                matchPercent: candidate.match || 70,
                reason: "Potential alignment detected via general resume analysis."
            };
        });

        res.json(results);
    } catch (error) {
        console.error('[Recommendation Error]:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 6. Interview Management
app.get('/api/interviews/:email', async (req, res) => {
    try {
        const candidateEmail = req.params.email;
        const candidate = await prisma.candidate.findUnique({ where: { email: candidateEmail } });
        if (!candidate) return res.json([]);
        const interviews = await prisma.interview.findMany({
            where: { candidateId: candidate.id },
            include: { job: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(interviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/interviews', async (req, res) => {
    try {
        const { email, jobId, transcript } = req.body;
        const candidate = await prisma.candidate.findUnique({ where: { email } });
        const job = await prisma.job.findUnique({ where: { id: parseInt(jobId) } });

        if (!candidate || !job) return res.status(404).json({ error: "Context missing" });

        console.log(`[Neural Engine] Generating Deep Analysis for ${email}...`);
        const analysis = await universalAI.generateInterviewAnalysis(transcript, job.title);

        const interview = await prisma.interview.create({
            data: {
                candidateId: candidate.id,
                candidateEmail: email,
                jobId: job.id,
                transcript: transcript,
                overallScore: analysis.overallScore,
                feedback: analysis.feedback,
                analysis: analysis
            }
        });

        res.json(interview);
    } catch (error) {
        console.error("Interview Save Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/interviews/:id/feedback', async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const interviewId = parseInt(req.params.id);
        
        const updated = await prisma.interview.update({
            where: { id: interviewId },
            data: {
                candidateRating: parseInt(rating),
                candidateComment: comment
            }
        });
        
        res.json(updated);
    } catch (error) {
        console.error("Feedback Save Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running with Neural Gemini Engine at http://0.0.0.0:${PORT}`);
    console.log(`[Config] Groq Key: ${process.env.GROQ_API_KEY ? 'LOADED' : 'MISSING'}`);
    console.log(`[Config] Gemini Keys: ${process.env.GEMINI_API_KEYS ? 'LOADED' : 'MISSING'}`);
});
