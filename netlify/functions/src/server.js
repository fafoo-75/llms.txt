"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crawler_js_1 = require("./crawler.js");
const generator_js_1 = require("./generator.js");
const categorizer_js_1 = require("./categorizer.js");
const app = (0, express_1.default)();
const PORT = 3000;
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
app.post('/api/generate', async (req, res) => {
    try {
        const { url, title, summary, maxPages, maxDepth, language, includeMarkdownVersions } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL requise' });
        }
        const crawlerOptions = {
            maxPages: maxPages || 50,
            maxDepth: maxDepth || 3,
            followExternal: false,
        };
        const crawler = new crawler_js_1.WebCrawler(url, crawlerOptions);
        let pages = await crawler.crawl();
        if (pages.length === 0) {
            return res.status(404).json({ error: 'Aucune page trouvée' });
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
        res.json({
            success: true,
            content: llmsTxt,
            pagesFound: pages.length,
            pages: pages.map(p => ({ title: p.title, url: p.url, category: p.category })),
        });
    }
    catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({
            error: 'Erreur lors de la génération',
            message: error instanceof Error ? error.message : 'Erreur inconnue'
        });
    }
});
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📝 Ouvrez votre navigateur pour utiliser le générateur`);
});
