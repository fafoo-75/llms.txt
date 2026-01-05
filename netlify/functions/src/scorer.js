"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageScorer = void 0;
const types_js_1 = require("./types.js");
class PageScorer {
    score(page) {
        let score = 0;
        score += this.scoreStability(page);
        score += this.scoreAuthority(page);
        score += this.scoreIntention(page);
        return score;
    }
    scoreStability(page) {
        let score = 0;
        const url = page.url.toLowerCase();
        const title = page.title.toLowerCase();
        const evergreenCategories = [
            types_js_1.PageCategory.ABOUT,
            types_js_1.PageCategory.SERVICES,
            types_js_1.PageCategory.PRICING,
            types_js_1.PageCategory.FAQ,
            types_js_1.PageCategory.CONTACT,
            types_js_1.PageCategory.LEGAL,
            types_js_1.PageCategory.PRIVACY,
            types_js_1.PageCategory.TERMS,
            types_js_1.PageCategory.GUIDE,
            types_js_1.PageCategory.SUPPORT,
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
    scoreAuthority(page) {
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
    scoreIntention(page) {
        let score = 0;
        const intentionCategories = {
            [types_js_1.PageCategory.FAQ]: 25,
            [types_js_1.PageCategory.SUPPORT]: 20,
            [types_js_1.PageCategory.PRICING]: 25,
            [types_js_1.PageCategory.SERVICES]: 20,
            [types_js_1.PageCategory.TERMS]: 15,
            [types_js_1.PageCategory.PRIVACY]: 15,
            [types_js_1.PageCategory.GUIDE]: 20,
        };
        if (page.category && intentionCategories[page.category]) {
            score += intentionCategories[page.category];
        }
        if (page.structuredData && page.structuredData.length > 0) {
            const valuableTypes = ['Product', 'FAQPage', 'HowTo', 'Service', 'Organization'];
            const hasValuableType = page.structuredData.some(type => valuableTypes.some(vt => type.includes(vt)));
            if (hasValuableType) {
                score += 15;
            }
        }
        return score;
    }
    scorePages(pages) {
        return pages.map(page => ({
            ...page,
            score: this.score(page)
        }));
    }
}
exports.PageScorer = PageScorer;
