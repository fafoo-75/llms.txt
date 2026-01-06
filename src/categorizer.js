"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageCategorizer = void 0;
const types_js_1 = require("./types.js");
class PageCategorizer {
    categorize(page) {
        const url = page.url.toLowerCase();
        const title = page.title.toLowerCase();
        const description = page.description.toLowerCase();
        const combined = `${url} ${title} ${description}`;
        if (this.matchesPattern(combined, ['about', 'a-propos', 'qui-sommes', 'equipe', 'team', 'notre-histoire'])) {
            return types_js_1.PageCategory.ABOUT;
        }
        if (this.matchesPattern(combined, ['service', 'offre', 'produit', 'solution', 'prestation'])) {
            return types_js_1.PageCategory.SERVICES;
        }
        if (this.matchesPattern(combined, ['tarif', 'prix', 'pricing', 'plan', 'abonnement', 'subscription'])) {
            return types_js_1.PageCategory.PRICING;
        }
        if (this.matchesPattern(combined, ['faq', 'question', 'aide', 'help'])) {
            return types_js_1.PageCategory.FAQ;
        }
        if (this.matchesPattern(combined, ['contact', 'nous-contacter', 'get-in-touch'])) {
            return types_js_1.PageCategory.CONTACT;
        }
        if (this.matchesPattern(combined, ['mention', 'legal', 'juridique'])) {
            return types_js_1.PageCategory.LEGAL;
        }
        if (this.matchesPattern(combined, ['confidentialite', 'privacy', 'donnees', 'rgpd', 'gdpr'])) {
            return types_js_1.PageCategory.PRIVACY;
        }
        if (this.matchesPattern(combined, ['cgv', 'cgu', 'condition', 'terms', 'tos'])) {
            return types_js_1.PageCategory.TERMS;
        }
        if (this.matchesPattern(combined, ['guide', 'tutoriel', 'tutorial', 'demarrage', 'getting-started', 'documentation', 'docs'])) {
            return types_js_1.PageCategory.GUIDE;
        }
        if (this.matchesPattern(combined, ['support', 'assistance', 'sav', 'depannage', 'troubleshoot'])) {
            return types_js_1.PageCategory.SUPPORT;
        }
        if (this.matchesPattern(combined, ['blog', 'article', 'actualite', 'news', 'actu'])) {
            return types_js_1.PageCategory.BLOG;
        }
        if (this.matchesPattern(combined, ['presse', 'press', 'media', 'communique'])) {
            return types_js_1.PageCategory.PRESS;
        }
        if (this.matchesPattern(combined, ['avis', 'review', 'temoignage', 'testimonial'])) {
            return types_js_1.PageCategory.FAQ;
        }
        return types_js_1.PageCategory.OTHER;
    }
    matchesPattern(text, patterns) {
        return patterns.some(pattern => text.includes(pattern));
    }
    categorizePage(page) {
        return {
            ...page,
            category: this.categorize(page)
        };
    }
    categorizePages(pages) {
        return pages.map(page => this.categorizePage(page));
    }
}
exports.PageCategorizer = PageCategorizer;
