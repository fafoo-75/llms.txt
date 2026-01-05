import { PageMetadata } from './types.js';
import { URLShaper } from './urlShaper.js';

export interface ClusterConfig {
  maxPerCluster: number;
  priorityShapes?: string[];
}

export class PageClusterer {
  private shaper = new URLShaper();

  cluster(pages: PageMetadata[], config: ClusterConfig = { maxPerCluster: 5 }): PageMetadata[] {
    const clusters = new Map<string, PageMetadata[]>();

    for (const page of pages) {
      const shape = page.urlShape || this.shaper.getShape(page.url);
      if (!clusters.has(shape)) {
        clusters.set(shape, []);
      }
      clusters.get(shape)!.push(page);
    }

    const result: PageMetadata[] = [];

    for (const [shape, clusterPages] of clusters.entries()) {
      const isPriority = config.priorityShapes?.includes(shape);
      const limit = isPriority ? clusterPages.length : Math.min(config.maxPerCluster, clusterPages.length);

      const sorted = clusterPages.sort((a, b) => (b.score || 0) - (a.score || 0));
      result.push(...sorted.slice(0, limit));
    }

    return result;
  }

  getClusterStats(pages: PageMetadata[]): Map<string, number> {
    const stats = new Map<string, number>();

    for (const page of pages) {
      const shape = page.urlShape || this.shaper.getShape(page.url);
      stats.set(shape, (stats.get(shape) || 0) + 1);
    }

    return stats;
  }
}
