import { PageMetadata, GeneratorOptions } from './types.js';
export declare class LLMSTxtGenerator {
    private scorer;
    private clusterer;
    generate(pages: PageMetadata[], websiteTitle: string, websiteSummary: string, options?: GeneratorOptions): string;
    private getPriorityShapes;
    private generateConventions;
    private generateContentGuidelines;
    private generateSections;
    private sortByCategory;
    private getSmartDescription;
    private truncateAtWord;
    private removeDuplicateShapes;
    private getDescriptionForCategory;
    private formatLLMSTxt;
}
//# sourceMappingURL=generator.d.ts.map