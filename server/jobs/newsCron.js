const cron = require('node-cron');
const { fetchNews } = require('../services/newsFetcher');

function setupNewsCron() {
    // Schedule: every 6 hours ("0 */6 * * *")
    cron.schedule('0 */6 * * *', async () => {
        console.log(`[NewsCron] Starting scheduled fetch at ${new Date().toISOString()}`);
        try {
            await fetchNews();
            console.log(`[NewsCron] Scheduled fetch successful at ${new Date().toISOString()}`);
        } catch (error) {
            console.error(`[NewsCron] Scheduled fetch failed at ${new Date().toISOString()}:`, error.message);
        }
    });

    // Run once immediately on server startup
    console.log(`[NewsCron] Starting initial fetch at ${new Date().toISOString()}`);
    fetchNews().then(() => {
        console.log(`[NewsCron] Initial fetch successful at ${new Date().toISOString()}`);
    }).catch(error => {
        console.error(`[NewsCron] Initial fetch failed at ${new Date().toISOString()}:`, error.message);
    });
}

module.exports = { setupNewsCron };
