import { PageMetadata, PageCategory } from './types.js';

export class PageCategorizer {
  categorize(page: PageMetadata): PageCategory {
    const url = page.url.toLowerCase();
    const title = page.title.toLowerCase();
    const description = page.description.toLowerCase();
    const combined = `${url} ${title} ${description}`;

    if (this.matchesPattern(combined, ['about', 'a-propos', 'qui-sommes', 'equipe', 'team', 'notre-histoire'])) {
      return PageCategory.ABOUT;
    }

    if (this.matchesPattern(combined, ['service', 'offre', 'produit', 'solution', 'prestation'])) {
      return PageCategory.SERVICES;
    }

    if (this.matchesPattern(combined, ['tarif', 'prix', 'pricing', 'plan', 'abonnement', 'subscription'])) {
      return PageCategory.PRICING;
    }

    if (this.matchesPattern(combined, ['faq', 'question', 'aide', 'help'])) {
      return PageCategory.FAQ;
    }

    if (this.matchesPattern(combined, ['contact', 'nous-contacter', 'get-in-touch'])) {
      return PageCategory.CONTACT;
    }

    if (this.matchesPattern(combined, ['mention', 'legal', 'juridique'])) {
      return PageCategory.LEGAL;
    }

    if (this.matchesPattern(combined, ['confidentialite', 'privacy', 'donnees', 'rgpd', 'gdpr'])) {
      return PageCategory.PRIVACY;
    }

    if (this.matchesPattern(combined, ['cgv', 'cgu', 'condition', 'terms', 'tos'])) {
      return PageCategory.TERMS;
    }

    if (this.matchesPattern(combined, ['guide', 'tutoriel', 'tutorial', 'demarrage', 'getting-started', 'documentation', 'docs'])) {
      return PageCategory.GUIDE;
    }

    if (this.matchesPattern(combined, ['support', 'assistance', 'sav', 'depannage', 'troubleshoot'])) {
      return PageCategory.SUPPORT;
    }

    if (this.matchesPattern(combined, ['blog', 'article', 'actualite', 'news', 'actu'])) {
      return PageCategory.BLOG;
    }

    if (this.matchesPattern(combined, ['presse', 'press', 'media', 'communique'])) {
      return PageCategory.PRESS;
    }

    if (this.matchesPattern(combined, ['avis', 'review', 'temoignage', 'testimonial'])) {
      return PageCategory.FAQ;
    }

    return PageCategory.OTHER;
  }

  private matchesPattern(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern));
  }

  categorizePage(page: PageMetadata): PageMetadata {
    return {
      ...page,
      category: this.categorize(page)
    };
  }

  categorizePages(pages: PageMetadata[]): PageMetadata[] {
    return pages.map(page => this.categorizePage(page));
  }
}
