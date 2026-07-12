function chunkText(text, chunkSize = 500, overlap = 100) {
  // Rough approximation: 1 token ≈ 4 characters
  const charSize = chunkSize * 4;
  const charOverlap = overlap * 4;
  const chunks = [];
  
  if (!text || text.length === 0) return [];
  
  let start = 0;
  while (start < text.length) {
    let end = start + charSize;
    chunks.push(text.slice(start, end));
    start = end - charOverlap;
    
    // Safety check to prevent infinite loop if overlap >= size
    if (start >= text.length || charOverlap >= charSize) break;
  }
  
  return chunks;
}

module.exports = { chunkText };
