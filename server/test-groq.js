const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function test() {
    try {
        console.log("Testing Groq with model: llama-3.3-70b-versatile");
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'Say hello' }],
            model: 'llama-3.3-70b-versatile',
        });
        console.log("Success:", completion.choices[0].message.content);
    } catch (err) {
        console.error("Error:", err.message);
    }
}

test();
