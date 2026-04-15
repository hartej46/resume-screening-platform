/**
 * Service to interact with Hugging Face Inference API
 * Using OpenAI-compatible endpoint for maximum stability
 */

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;
// Switching to a more stable, widely available Instruct model
const MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.2";
const API_URL = "https://router.huggingface.co/v1/chat/completions";

export const queryAI = async (messages) => {
    console.log("Querying HireAI with token:", HF_TOKEN ? "Present" : "Missing");
    
    if (!HF_TOKEN) {
        throw new Error("Hugging Face token is missing (VITE_HF_TOKEN). Please check your .env file.");
    }

    try {
        const response = await fetch(API_URL, {
            headers: {
                Authorization: `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                model: MODEL_ID,
                messages: messages,
                max_tokens: 800,
                temperature: 0.7,
                stream: false
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("HF API Error Response:", errorText);
            throw new Error(`AI Service Error: ${response.status} - ${errorText.slice(0, 100)}`);
        }

        const result = await response.json();
        
        if (!result.choices || result.choices.length === 0) {
            throw new Error("AI returned an empty response. The model might be overloaded.");
        }
        
        const message = result.choices[0].message;
        if (!message || !message.content) {
            // Some models return reasoning_content in a different field, but for Mistral we expect content
            if (message.reasoning_content) {
                return { content: message.reasoning_content };
            }
            throw new Error("AI returned a message with no content.");
        }
        
        return message;
    } catch (error) {
        console.error("HireAI Service Critical Error:", error);
        throw error;
    }
};

export const getSystemPrompt = (candidate) => {
    const basePrompt = "You are HireAI Copilot, a high-performance recruitment intelligence engine. Your tone is professional, technical, and analytical. You help recruiters find the best talent by analyzing deep skill overlaps.";
    
    if (!candidate) {
        return `${basePrompt} You have access to the entire candidate repository. Focus on comparing candidates and identifying top talent based on roles.`;
    }

    return `${basePrompt} 
    CONTEXTUAL ANALYSIS: You are currently focused on ${candidate.name} (${candidate.role}).
    CANDIDATE DATA:
    - Summary: ${candidate.summary}
    - Skills: ${candidate.skills.join(", ")}
    - AI Score: ${candidate.match}%
    - HR Notes: ${candidate.notes || "No internal notes yet."}
    
    Directly answer questions about this candidate using the data above. If asked for interview questions, tailor them specifically to their skills and gaps.`;
};
