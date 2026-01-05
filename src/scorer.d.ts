import { PageMetadata } from './types.js';
export declare class PageScorer {
    score(page: PageMetadata): number;
    private scoreStability;
    private scoreAuthority;
    private scoreIntention;
    scorePages(pages: PageMetadata[]): PageMetadata[];
}
//# sourceMappingURL=scorer.d.ts.map