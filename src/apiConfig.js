const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
export const API_BASE_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
