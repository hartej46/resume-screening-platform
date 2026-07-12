/**
 * Service to interact with Hugging Face Inference API
 * Using OpenAI-compatible endpoint for maximum stability
 */

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;
const API_URL = "https://api-inference.huggingface.co/v1/chat/completions";
const MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.2";


import { API_BASE_URL } from '../apiConfig';

export const queryAI = async (messages) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/interview/chat`, {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ messages }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI Service Error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        // The backend returns { text: "...", _provider: "..." }
        // We need to return it in the format the sidebar expects (OpenAI-like or simple content)
        return {
            content: result.text || result.content,
            role: 'assistant'
        };
    } catch (error) {
        console.error("HireAI Backend Error:", error);
        throw error;
    }
};

export const getSystemPrompt = (candidate, allCandidates = []) => {
    const basePrompt = "You are HireAI Copilot, a high-performance recruitment intelligence engine. Your tone is professional, technical, and analytical. You help recruiters find the best talent by analyzing deep skill overlaps.";
    
    if (!candidate) {
        let repoContext = "REPOSITORY OVERVIEW:\n";
        if (allCandidates && allCandidates.length > 0) {
            repoContext += allCandidates.map(c => 
                `- ${c.name} (${c.role}): Match ${c.match}%. Summary: ${c.summary.slice(0, 100)}... Skills: ${c.skills?.slice(0, 5).join(", ")}`
            ).join("\n");
        } else {
            repoContext += "The repository is currently empty.";
        }

        return `${basePrompt} 
        
        ${repoContext}
        
        GOAL: Use the REPOSITORY OVERVIEW above to answer questions. If asked to compare candidates or find the best person for a role, refer specifically to the data provided. NEVER hallucinate candidates who are not in the list.`;
    }

    return `${basePrompt} 
    CONTEXTUAL ANALYSIS: You are currently focused on ${candidate.name} (${candidate.role}).
    CANDIDATE DATA:
    - Summary: ${candidate.summary}
    - Skills: ${candidate.skills?.join(", ")}
    - AI Score: ${candidate.match}%
    - HR Notes: ${candidate.notes || "No internal notes yet."}
    
    Directly answer questions about this candidate using the data above. If asked for interview questions, tailor them specifically to their skills and gaps.`;
};
