import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { PageMetadata, CrawlerOptions } from './types.js';
import { URLShaper } from './urlShaper.js';

export class WebCrawler {
  private visited = new Set<string>();
  private pages: PageMetadata[] = [];
  private baseUrl: string;
  private baseDomain: string;
  private shaper = new URLShaper();
  private inlinksMap = new Map<string, number>();

  constructor(private url: string, private options: CrawlerOptions = {}) {
    this.baseUrl = new URL(url).origin;
    this.baseDomain = new URL(url).hostname;
  }

  async crawl(): Promise<PageMetadata[]> {
    const maxPages = this.options.maxPages || 50;
    const maxDepth = this.options.maxDepth || 3;
    
    const queue: Array<{url: string, depth: number}> = [{url: this.url, depth: 0}];
    const concurrency = 5;
    
    while (queue.length > 0 && this.pages.length < maxPages) {
      const batch = queue.splice(0, concurrency);
      const results = await Promise.allSettled(
        batch.map(item => this.crawlPage(item.url, item.depth, maxDepth, maxPages))
      );
      
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          const links = result.value;
          for (const link of links) {
            const normalized = this.normalizeUrl(link.url);
            if (!this.visited.has(normalized) && link.depth <= maxDepth && this.pages.length < maxPages) {
              queue.push(link);
            }
          }
        }
      }
    }
    
    this.calculateInlinks();
    return this.pages;
  }

  private async crawlPage(url: string, depth: number, maxDepth: number, maxPages: number): Promise<Array<{url: string, depth: number}> | null> {
    if (depth > maxDepth || this.pages.length >= maxPages) {
      return null;
    }

    const normalizedUrl = this.normalizeUrl(url);
    if (this.visited.has(normalizedUrl)) {
      return null;
    }

    if (!this.shouldCrawl(normalizedUrl)) {
      return null;
    }

    this.visited.add(normalizedUrl);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LLMS-TXT-Generator/1.0)',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('text/html')) {
        return null;
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      const hasNoIndex = $('meta[name="robots"]').attr('content')?.includes('noindex') || false;
      if (hasNoIndex) {
        return null;
      }

      const canonicalUrl = $('link[rel="canonical"]').attr('href') || normalizedUrl;
      
      const title = $('title').text().trim() || 
                    $('h1').first().text().trim() || 
                    'Sans titre';
      
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || 
                         $('p').first().text().trim().substring(0, 200) || 
                         '';

      const structuredData = this.extractStructuredData($);
      const isInMenu = this.isInNavigation($, normalizedUrl);

      this.pages.push({
        url: normalizedUrl,
        title,
        description,
        depth,
        hasNoIndex,
        canonicalUrl,
        structuredData,
        isInMenu,
        urlShape: this.shaper.getShape(normalizedUrl),
      });

      const links = this.extractLinks($, url);
      return links.map(link => ({url: link, depth: depth + 1}));
      
    } catch (error) {
      return null;
    }
  }

  private extractLinks($: cheerio.CheerioAPI, currentUrl: string): string[] {
    const links: string[] = [];
    
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;

      try {
        const absoluteUrl = new URL(href, currentUrl).href;
        const urlObj = new URL(absoluteUrl);

        if (!this.options.followExternal && urlObj.hostname !== this.baseDomain) {
          return;
        }

        if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
          links.push(absoluteUrl);
        }
      } catch (e) {
      }
    });

    return links;
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      urlObj.hash = '';
      urlObj.search = '';
      let pathname = urlObj.pathname;
      if (pathname.endsWith('/') && pathname.length > 1) {
        pathname = pathname.slice(0, -1);
      }
      return `${urlObj.origin}${pathname}`;
    } catch {
      return url;
    }
  }

  private shouldCrawl(url: string): boolean {
    if (this.shaper.hasTrackingParams(url)) {
      return false;
    }

    if (this.shaper.isPagination(url)) {
      return false;
    }

    const defaultExcludes = [
      /\.(pdf|jpg|jpeg|png|gif|svg|ico|css|js|json|xml|zip|tar|gz)$/i,
      /\/(login|logout|signin|signup|register|admin|api)\//i,
    ];

    for (const pattern of defaultExcludes) {
      if (pattern.test(url)) {
        return false;
      }
    }

    if (this.options.excludePatterns) {
      for (const pattern of this.options.excludePatterns) {
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        if (regex.test(url)) {
          return false;
        }
      }
    }

    if (this.options.includePatterns && this.options.includePatterns.length > 0) {
      return this.options.includePatterns.some(pattern => {
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        return regex.test(url);
      });
    }

    return true;
  }

  private extractStructuredData($: cheerio.CheerioAPI): string[] {
    const types: string[] = [];
    $('script[type="application/ld+json"]').each((_, elem) => {
      try {
        const content = $(elem).html();
        if (content) {
          const data = JSON.parse(content);
          if (data['@type']) {
            types.push(data['@type']);
          } else if (data['@graph']) {
            data['@graph'].forEach((item: any) => {
              if (item['@type']) types.push(item['@type']);
            });
          }
        }
      } catch (e) {
      }
    });
    return types;
  }

  private isInNavigation($: cheerio.CheerioAPI, url: string): boolean {
    const navSelectors = ['nav', 'header', '[role="navigation"]', '.menu', '.nav'];
    for (const selector of navSelectors) {
      const found = $(selector).find(`a[href*="${url.split('/').pop()}"]`).length > 0;
      if (found) return true;
    }
    return false;
  }

  private calculateInlinks(): void {
    for (const page of this.pages) {
      page.inlinks = 0;
    }
  }
}
