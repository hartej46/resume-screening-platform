const job = { title: "Engineer" };
const questionScript = "1. Tell me about your background.\n2. Explain your technical expertise.\n3. How do you handle complex engineering challenges?\n4. What is your preferred tech stack and why?";

const systemPrompt = `You are a Senior Technical Interviewer conducting a live technical screening for the role of ${job?.title || 'Engineer'}. 

STRICT INTERVIEW SCRIPT:
${questionScript}

CORE PROTOCOL:
1. You must ask the questions EXACTLY as written in the script above, one by one.`;

const scriptMatch = systemPrompt.match(/STRICT INTERVIEW SCRIPT:\n([\s\S]*?)(?:\n\nCORE PROTOCOL|\n\nPROFESSIONALISM|$)/);
console.log("Matched script:\n", scriptMatch ? scriptMatch[1] : 'FAIL');
