import express from 'express';
import { WebCrawler } from './crawler.js';
import { LLMSTxtGenerator } from './generator.js';
import { PageCategorizer } from './categorizer.js';
import { CrawlerOptions, GeneratorOptions } from './types.js';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/api/generate', async (req, res) => {
  try {
    const { url, title, summary, maxPages, maxDepth, language, includeMarkdownVersions } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL requise' });
    }

    const crawlerOptions: CrawlerOptions = {
      maxPages: maxPages || 50,
      maxDepth: maxDepth || 3,
      followExternal: false,
    };

    const crawler = new WebCrawler(url, crawlerOptions);
    let pages = await crawler.crawl();

    if (pages.length === 0) {
      return res.status(404).json({ error: 'Aucune page trouvée' });
    }

    const categorizer = new PageCategorizer();
    pages = categorizer.categorizePages(pages);

    const websiteTitle = title || pages[0]?.title || 'Mon Site Web';
    const websiteSummary = summary || pages[0]?.description || 'Description du site web';

    const generatorOptions: GeneratorOptions = {
      language: language || 'fr-FR',
      includeMarkdownVersions: includeMarkdownVersions || false,
    };

    const generator = new LLMSTxtGenerator();
    const llmsTxt = generator.generate(pages, websiteTitle, websiteSummary, generatorOptions);

    res.json({
      success: true,
      content: llmsTxt,
      pagesFound: pages.length,
      pages: pages.map(p => ({ title: p.title, url: p.url, category: p.category })),
    });
  } catch (error) {
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
