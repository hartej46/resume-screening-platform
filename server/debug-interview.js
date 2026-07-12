const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEYS.split(',')[0].trim());

const messages = [
  { role: 'system', content: "You are a real-time voice technical interviewer for the role of Engineer. Ask ONE short question at a time. Keep your responses under 3 sentences." },
  { role: 'assistant', content: "Hi Hartejsingh, thanks for taking the time to speak with me today. Can you tell me about your experience with React and how you've applied it in previous projects to improve frontend architecture?" },
  { role: 'user', content: "hey can you listen me so I have not work much on that project but I have literally 3 and half years of X + 1 react and I have use mongo DB and extra" }
];

async function testGroq() {
    console.log("--- Testing Groq ---");
    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000
        });
        console.log("Groq Success:", completion.choices[0].message.content);
    } catch (err) {
        console.error("Groq Error:", err.message);
    }
}

async function testGemini() {
    console.log("\n--- Testing Gemini ---");
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: messages[0].content
        });
        
        const history = [
            { role: 'model', parts: [{ text: messages[1].content }] }
        ];
        
        // Wait, if history starts with model, Gemini might fail.
        // Let's test the current implementation logic.
        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: "Understood. Please continue." }] },
                { role: 'model', parts: [{ text: messages[1].content }] }
            ]
        });
        
        const result = await chat.sendMessage(messages[2].content);
        console.log("Gemini Success:", result.response.text());
    } catch (err) {
        console.error("Gemini Error:", err.message);
    }
}

async function run() {
    await testGroq();
    await testGemini();
}

run();
