import { PageMetadata, PageCategory } from './types.js';
export declare class PageCategorizer {
    categorize(page: PageMetadata): PageCategory;
    private matchesPattern;
    categorizePage(page: PageMetadata): PageMetadata;
    categorizePages(pages: PageMetadata[]): PageMetadata[];
}
//# sourceMappingURL=categorizer.d.ts.map