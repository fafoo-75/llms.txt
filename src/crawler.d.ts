import { PageMetadata, CrawlerOptions } from './types.js';
export declare class WebCrawler {
    private url;
    private options;
    private visited;
    private pages;
    private baseUrl;
    private baseDomain;
    private shaper;
    private inlinksMap;
    constructor(url: string, options?: CrawlerOptions);
    crawl(): Promise<PageMetadata[]>;
    private crawlPage;
    private extractLinks;
    private normalizeUrl;
    private shouldCrawl;
    private extractStructuredData;
    private isInNavigation;
    private calculateInlinks;
}
//# sourceMappingURL=crawler.d.ts.map