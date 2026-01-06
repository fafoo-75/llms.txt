import { Handler, HandlerEvent } from '@netlify/functions';
import { WebCrawler } from '../../src/crawler.js';
import { LLMSTxtGenerator } from '../../src/generator.js';
import { PageCategorizer } from '../../src/categorizer.js';
import { CrawlerOptions, GeneratorOptions } from '../../src/types.js';

export const handler: Handler = async (event: HandlerEvent) => {
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

    const crawlerOptions: CrawlerOptions = {
      maxPages: maxPages || 20,
      maxDepth: maxDepth || 2,
      followExternal: false,
    };

    const crawler = new WebCrawler(url, crawlerOptions);
    let pages = await crawler.crawl();

    if (pages.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Aucune page trouvée' }),
      };
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
  } catch (error) {
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
