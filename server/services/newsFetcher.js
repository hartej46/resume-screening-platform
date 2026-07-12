const axios = require('axios');
const cheerio = require('cheerio');
const NewsAPI = require('newsapi');
const prisma = require('../lib/prisma');

const newsapi = new NewsAPI(process.env.NEWS_API_KEY || '1a5b3bf9fee44df4a3240c0600d9322e');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchFromNewsAPI() {
    try {
        console.log('[NewsFetcher] Fetching from NewsAPI...');
        const response = await newsapi.v2.everything({
            q: 'tech jobs OR hiring OR layoffs OR recruitment',
            language: 'en',
            pageSize: 20,
            sortBy: 'publishedAt'
        });

        if (response.status === 'ok' && response.articles && response.articles.length >= 5) {
            return response.articles.map(art => ({
                title: art.title,
                summary: art.description || art.content || 'No summary available',
                url: art.url,
                source: art.source.name || 'NewsAPI',
                imageUrl: art.urlToImage,
            }));
        }
        console.log('[NewsFetcher] NewsAPI returned insufficient results.');
        return [];
    } catch (error) {
        console.error('[NewsFetcher] NewsAPI Error:', error.message);
        return [];
    }
}

async function scrapeHackerNews() {
    try {
        console.log('[NewsFetcher] Scraping Hacker News...');
        const { data } = await axios.get('https://news.ycombinator.com');
        const $ = cheerio.load(data);
        const articles = [];

        $('.athing').each((i, el) => {
            const title = $(el).find('.titleline > a').text();
            const url = $(el).find('.titleline > a').attr('href');
            
            if (title.toLowerCase().includes('hiring') || title.toLowerCase().includes('jobs')) {
                articles.push({
                    title,
                    summary: 'Hacker News discussion regarding hiring or jobs.',
                    url: url.startsWith('http') ? url : `https://news.ycombinator.com/${url}`,
                    source: 'Hacker News',
                    imageUrl: null
                });
            }
        });

        return articles;
    } catch (error) {
        console.error('[NewsFetcher] HN Scraper Error:', error.message);
        return [];
    }
}

async function scrapeTechCrunch() {
    try {
        console.log('[NewsFetcher] Scraping TechCrunch...');
        const { data } = await axios.get('https://techcrunch.com/tag/jobs/');
        const $ = cheerio.load(data);
        const articles = [];

        $('.loop-card__title').each((i, el) => {
            const title = $(el).find('a').text().trim();
            const url = $(el).find('a').attr('href');
            const summary = $(el).closest('.loop-card').find('.loop-card__content').text().trim() || 'Job related news from TechCrunch.';
            const imageUrl = $(el).closest('.loop-card').find('img').attr('src');

            articles.push({
                title,
                summary,
                url,
                source: 'TechCrunch',
                imageUrl
            });
        });

        return articles;
    } catch (error) {
        console.error('[NewsFetcher] TechCrunch Scraper Error:', error.message);
        return [];
    }
}

async function fetchNews() {
    let articles = await fetchFromNewsAPI();

    if (articles.length < 5) {
        console.log('[NewsFetcher] Falling back to scrapers...');
        const hnArticles = await scrapeHackerNews();
        await delay(3000);
        const tcArticles = await scrapeTechCrunch();
        
        articles = [...articles, ...hnArticles, ...tcArticles];
    }

    // Deduplicate and save top 20
    const uniqueArticles = [];
    const urls = new Set();

    for (const art of articles) {
        if (!urls.has(art.url)) {
            urls.add(art.url);
            uniqueArticles.push(art);
        }
        if (uniqueArticles.length >= 20) break;
    }

    console.log(`[NewsFetcher] Saving ${uniqueArticles.length} articles to DB...`);

    for (const art of uniqueArticles) {
        await prisma.newsArticle.upsert({
            where: { url: art.url },
            update: {
                title: art.title,
                summary: art.summary,
                source: art.source,
                imageUrl: art.imageUrl,
                fetchedAt: new Date()
            },
            create: {
                title: art.title,
                summary: art.summary,
                url: art.url,
                source: art.source,
                imageUrl: art.imageUrl
            }
        });
    }

    console.log('[NewsFetcher] Fetching and saving complete.');
    return uniqueArticles;
}

module.exports = { fetchNews };
