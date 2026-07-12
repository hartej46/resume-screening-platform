const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { fetchNews } = require('../services/newsFetcher');

// GET /api/news: return latest 20 articles
// Optional query param: candidateId to filter news by candidate's skills
router.get('/', async (req, res) => {
    try {
        const { candidateId } = req.query;
        let articles = await prisma.newsArticle.findMany({
            orderBy: { fetchedAt: 'desc' },
            take: 20
        });

        if (candidateId) {
            const candidate = await prisma.candidate.findUnique({
                where: { id: parseInt(candidateId) },
                select: { skills: true }
            });

            if (candidate && candidate.skills && candidate.skills.length > 0) {
                // Simple keyword matching for "related" news
                articles = articles.filter(art => {
                    const content = (art.title + ' ' + art.summary).toLowerCase();
                    return candidate.skills.some(skill => content.includes(skill.toLowerCase()));
                });
                
                // If no related news found, return latest (don't leave them empty-handed)
                if (articles.length === 0) {
                    articles = await prisma.newsArticle.findMany({
                        orderBy: { fetchedAt: 'desc' },
                        take: 10
                    });
                }
            }
        }

        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/news/refresh: manual trigger
router.get('/refresh', async (req, res) => {
    try {
        console.log('[NewsRouter] Manual refresh triggered');
        const articles = await fetchNews();
        res.json({ message: 'Refresh complete', count: articles.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
