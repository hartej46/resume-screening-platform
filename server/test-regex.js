const systemPrompt = `You are a Senior Technical Interviewer conducting a live technical screening for the role of Engineer. 

STRICT INTERVIEW SCRIPT:
1. Tell me about your background.
2. Explain your technical expertise.
3. How do you handle complex engineering challenges?
4. What is your preferred tech stack and why?

CORE PROTOCOL:
1. You must ask the questions EXACTLY...`;

const scriptMatch = systemPrompt.match(/STRICT INTERVIEW SCRIPT:\n([\s\S]*?)(?:\n\nCORE PROTOCOL|\n\nPROFESSIONALISM|$)/);
console.log("scriptMatch:", scriptMatch ? scriptMatch[1].trim() : 'failed');

const roleMatch = systemPrompt.match(/role of (.+?)[\.\n]/);
console.log("roleMatch:", roleMatch ? roleMatch[1] : 'failed');
