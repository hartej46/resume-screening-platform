const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiExtractor {
    constructor() {
        const keys = process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',') : [];
        console.log(`[Gemini] Initializing with ${keys.length} API keys`);
        this.genAIs = keys.map(k => new GoogleGenerativeAI(k.trim(), { apiVersion: 'v1' }));
        this.currentIndex = 0;
    }

    getModel(systemInstruction) {
        if (this.genAIs.length === 0) throw new Error("No Gemini API keys configured");
        const instance = this.genAIs[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.genAIs.length;
        const config = { model: "gemini-2.0-flash" };
        if (systemInstruction) config.systemInstruction = systemInstruction;
        return instance.getGenerativeModel(config);
    }

    cleanJson(text) {
        try {
            // Remove markdown blocks
            const cleanText = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
            return JSON.parse(cleanText);
        } catch (e) {
            // Fallback: try to find anything that looks like JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try { return JSON.parse(jsonMatch[0]); } catch (inner) {}
            }
            throw new Error(`Failed to parse Gemini output as JSON: ${e.message}`);
        }
    }
}

const extractor = new GeminiExtractor();

async function extractResumeData(resumeText) {
    const systemPrompt = `You are a resume parser. Extract structured data from the resume text below.
Return ONLY a valid JSON object with exactly this structure, no other text:
{
  "skills": ["skill1", "skill2"],
  "years_experience": 0,
  "seniority_level": "intern | junior | mid | senior | lead",
  "education": [{ "degree": "", "field": "", "institution": "" }],
  "certifications": ["cert1"],
  "location": "City, Country or Remote"
}
Rules:
- skills: all technical and soft skills, normalized to lowercase
- years_experience: integer, infer from dates if not stated, 0 if fresher
- seniority_level: infer from years and titles, pick exactly one from enum
- education: all degrees, most recent first
- certifications: empty array if none
- location: last known location, or "not specified"`;

    const model = extractor.getModel(systemPrompt);
    const result = await model.generateContent(resumeText.slice(0, 10000));
    return extractor.cleanJson(result.response.text());
}

async function extractJDData(jdText) {
    const systemPrompt = `You are a job description parser. Extract structured requirements from the JD below.
Return ONLY a valid JSON object with exactly this structure, no other text:
{
  "required_skills": ["skill1"],
  "preferred_skills": ["skill1"],
  "min_years_experience": 0,
  "seniority_level": "intern | junior | mid | senior | lead",
  "education_requirement": "none | any_degree | bachelors | masters | phd",
  "certifications_preferred": ["cert1"],
  "location": "City, Country or Remote"
}
Rules:
- required_skills: must-have skills only
- preferred_skills: nice-to-have skills
- min_years_experience: integer minimum, 0 if not specified
- seniority_level: infer from title and requirements
- education_requirement: pick exactly one from enum
- certifications_preferred: empty array if none
- location: "Remote" if fully remote, otherwise city/country`;

    const model = extractor.getModel(systemPrompt);
    const result = await model.generateContent(jdText.slice(0, 10000));
    return extractor.cleanJson(result.response.text());
}

module.exports = {
    extractResumeData,
    extractJDData
};
