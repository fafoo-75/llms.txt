"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebCrawler = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const cheerio = __importStar(require("cheerio"));
const urlShaper_js_1 = require("./urlShaper.js");
class WebCrawler {
    constructor(url, options = {}) {
        this.url = url;
        this.options = options;
        this.visited = new Set();
        this.pages = [];
        this.shaper = new urlShaper_js_1.URLShaper();
        this.inlinksMap = new Map();
        this.baseUrl = new URL(url).origin;
        this.baseDomain = new URL(url).hostname;
    }
    async crawl() {
        await this.crawlPage(this.url, 0);
        this.calculateInlinks();
        return this.pages;
    }
    async crawlPage(url, depth) {
        const maxDepth = this.options.maxDepth || 3;
        const maxPages = this.options.maxPages || 50;
        if (depth > maxDepth || this.pages.length >= maxPages) {
            return;
        }
        const normalizedUrl = this.normalizeUrl(url);
        if (this.visited.has(normalizedUrl)) {
            return;
        }
        if (!this.shouldCrawl(normalizedUrl)) {
            return;
        }
        this.visited.add(normalizedUrl);
        try {
            const response = await (0, node_fetch_1.default)(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; LLMS-TXT-Generator/1.0)',
                },
            });
            if (!response.ok) {
                return;
            }
            const contentType = response.headers.get('content-type');
            if (!contentType?.includes('text/html')) {
                return;
            }
            const html = await response.text();
            const $ = cheerio.load(html);
            const hasNoIndex = $('meta[name="robots"]').attr('content')?.includes('noindex') || false;
            if (hasNoIndex) {
                return;
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
            for (const link of links) {
                if (this.pages.length < maxPages) {
                    await this.crawlPage(link, depth + 1);
                }
            }
        }
        catch (error) {
            console.error(`Erreur lors du crawl de ${url}:`, error);
        }
    }
    extractLinks($, currentUrl) {
        const links = [];
        $('a[href]').each((_, element) => {
            const href = $(element).attr('href');
            if (!href)
                return;
            try {
                const absoluteUrl = new URL(href, currentUrl).href;
                const urlObj = new URL(absoluteUrl);
                if (!this.options.followExternal && urlObj.hostname !== this.baseDomain) {
                    return;
                }
                if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
                    links.push(absoluteUrl);
                }
            }
            catch (e) {
            }
        });
        return links;
    }
    normalizeUrl(url) {
        try {
            const urlObj = new URL(url);
            urlObj.hash = '';
            urlObj.search = '';
            let pathname = urlObj.pathname;
            if (pathname.endsWith('/') && pathname.length > 1) {
                pathname = pathname.slice(0, -1);
            }
            return `${urlObj.origin}${pathname}`;
        }
        catch {
            return url;
        }
    }
    shouldCrawl(url) {
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
    extractStructuredData($) {
        const types = [];
        $('script[type="application/ld+json"]').each((_, elem) => {
            try {
                const content = $(elem).html();
                if (content) {
                    const data = JSON.parse(content);
                    if (data['@type']) {
                        types.push(data['@type']);
                    }
                    else if (data['@graph']) {
                        data['@graph'].forEach((item) => {
                            if (item['@type'])
                                types.push(item['@type']);
                        });
                    }
                }
            }
            catch (e) {
            }
        });
        return types;
    }
    isInNavigation($, url) {
        const navSelectors = ['nav', 'header', '[role="navigation"]', '.menu', '.nav'];
        for (const selector of navSelectors) {
            const found = $(selector).find(`a[href*="${url.split('/').pop()}"]`).length > 0;
            if (found)
                return true;
        }
        return false;
    }
    calculateInlinks() {
        for (const page of this.pages) {
            page.inlinks = 0;
        }
    }
}
exports.WebCrawler = WebCrawler;
//# sourceMappingURL=crawler.js.map