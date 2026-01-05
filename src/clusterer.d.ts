import { PageMetadata } from './types.js';
export interface ClusterConfig {
    maxPerCluster: number;
    priorityShapes?: string[];
}
export declare class PageClusterer {
    private shaper;
    cluster(pages: PageMetadata[], config?: ClusterConfig): PageMetadata[];
    getClusterStats(pages: PageMetadata[]): Map<string, number>;
}
//# sourceMappingURL=clusterer.d.ts.map