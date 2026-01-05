"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const crawler_js_1 = require("../../src/crawler.js");
const generator_js_1 = require("../../src/generator.js");
const categorizer_js_1 = require("../../src/categorizer.js");
const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
    try {
        const body = JSON.parse(event.body || '{}');
        const { url, title, summary, maxPages, maxDepth, language, includeMarkdownVersions } = body;
        if (!url) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'URL requise' }),
            };
        }
        const crawlerOptions = {
            maxPages: maxPages || 50,
            maxDepth: maxDepth || 3,
            followExternal: false,
        };
        const crawler = new crawler_js_1.WebCrawler(url, crawlerOptions);
        let pages = await crawler.crawl();
        if (pages.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Aucune page trouvée' }),
            };
        }
        const categorizer = new categorizer_js_1.PageCategorizer();
        pages = categorizer.categorizePages(pages);
        const websiteTitle = title || pages[0]?.title || 'Mon Site Web';
        const websiteSummary = summary || pages[0]?.description || 'Description du site web';
        const generatorOptions = {
            language: language || 'fr-FR',
            includeMarkdownVersions: includeMarkdownVersions || false,
        };
        const generator = new generator_js_1.LLMSTxtGenerator();
        const llmsTxt = generator.generate(pages, websiteTitle, websiteSummary, generatorOptions);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                success: true,
                content: llmsTxt,
                pagesFound: pages.length,
                pages: pages.map(p => ({ title: p.title, url: p.url, category: p.category })),
            }),
        };
    }
    catch (error) {
        console.error('Erreur:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Erreur lors de la génération',
                message: error instanceof Error ? error.message : 'Erreur inconnue',
            }),
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=generate.js.map