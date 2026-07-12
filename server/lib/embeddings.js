const { GoogleGenerativeAI } = require('@google/generative-ai');

const keys = process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',') : [];
const genAI = new GoogleGenerativeAI(keys[0].trim());

async function getEmbeddings(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('[Embeddings] Error:', error.message);
    throw error;
  }
}

module.exports = { getEmbeddings };
