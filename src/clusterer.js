"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageClusterer = void 0;
const urlShaper_js_1 = require("./urlShaper.js");
class PageClusterer {
    constructor() {
        this.shaper = new urlShaper_js_1.URLShaper();
    }
    cluster(pages, config = { maxPerCluster: 5 }) {
        const clusters = new Map();
        for (const page of pages) {
            const shape = page.urlShape || this.shaper.getShape(page.url);
            if (!clusters.has(shape)) {
                clusters.set(shape, []);
            }
            clusters.get(shape).push(page);
        }
        const result = [];
        for (const [shape, clusterPages] of clusters.entries()) {
            const isPriority = config.priorityShapes?.includes(shape);
            const limit = isPriority ? clusterPages.length : Math.min(config.maxPerCluster, clusterPages.length);
            const sorted = clusterPages.sort((a, b) => (b.score || 0) - (a.score || 0));
            result.push(...sorted.slice(0, limit));
        }
        return result;
    }
    getClusterStats(pages) {
        const stats = new Map();
        for (const page of pages) {
            const shape = page.urlShape || this.shaper.getShape(page.url);
            stats.set(shape, (stats.get(shape) || 0) + 1);
        }
        return stats;
    }
}
exports.PageClusterer = PageClusterer;
//# sourceMappingURL=clusterer.js.map