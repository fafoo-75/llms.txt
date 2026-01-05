import { PageMetadata, PageCategory } from './types.js';

export class PageScorer {
  score(page: PageMetadata): number {
    let score = 0;

    score += this.scoreStability(page);
    score += this.scoreAuthority(page);
    score += this.scoreIntention(page);

    return score;
  }

  private scoreStability(page: PageMetadata): number {
    let score = 0;
    const url = page.url.toLowerCase();
    const title = page.title.toLowerCase();

    const evergreenCategories = [
      PageCategory.ABOUT,
      PageCategory.SERVICES,
      PageCategory.PRICING,
      PageCategory.FAQ,
      PageCategory.CONTACT,
      PageCategory.LEGAL,
      PageCategory.PRIVACY,
      PageCategory.TERMS,
      PageCategory.GUIDE,
      PageCategory.SUPPORT,
    ];

    if (page.category && evergreenCategories.includes(page.category)) {
      score += 30;
    }

    const ephemeralPatterns = [
      /\d{4}\/\d{2}\/\d{2}/,
      /news|actualite|event|promo|offer-\d+/i,
    ];

    if (ephemeralPatterns.some(p => p.test(url) || p.test(title))) {
      score -= 20;
    }

    return score;
  }

  private scoreAuthority(page: PageMetadata): number {
    let score = 0;

    if (page.depth !== undefined) {
      score += Math.max(0, 30 - (page.depth * 5));
    }

    if (page.inlinks !== undefined) {
      score += Math.min(20, page.inlinks * 2);
    }

    if (page.isInMenu) {
      score += 25;
    }

    if (page.canonicalUrl && page.canonicalUrl === page.url) {
      score += 10;
    }

    return score;
  }

  private scoreIntention(page: PageMetadata): number {
    let score = 0;

    const intentionCategories = {
      [PageCategory.FAQ]: 25,
      [PageCategory.SUPPORT]: 20,
      [PageCategory.PRICING]: 25,
      [PageCategory.SERVICES]: 20,
      [PageCategory.TERMS]: 15,
      [PageCategory.PRIVACY]: 15,
      [PageCategory.GUIDE]: 20,
    };

    if (page.category && intentionCategories[page.category]) {
      score += intentionCategories[page.category];
    }

    if (page.structuredData && page.structuredData.length > 0) {
      const valuableTypes = ['Product', 'FAQPage', 'HowTo', 'Service', 'Organization'];
      const hasValuableType = page.structuredData.some(type => 
        valuableTypes.some(vt => type.includes(vt))
      );
      if (hasValuableType) {
        score += 15;
      }
    }

    return score;
  }

  scorePages(pages: PageMetadata[]): PageMetadata[] {
    return pages.map(page => ({
      ...page,
      score: this.score(page)
    }));
  }
}
