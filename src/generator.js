"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMSTxtGenerator = void 0;
const types_js_1 = require("./types.js");
const scorer_js_1 = require("./scorer.js");
const clusterer_js_1 = require("./clusterer.js");
class LLMSTxtGenerator {
    constructor() {
        this.scorer = new scorer_js_1.PageScorer();
        this.clusterer = new clusterer_js_1.PageClusterer();
    }
    generate(pages, websiteTitle, websiteSummary, options = {}) {
        let processedPages = this.scorer.scorePages(pages);
        processedPages = this.clusterer.cluster(processedPages, {
            maxPerCluster: 3,
            priorityShapes: this.getPriorityShapes(processedPages),
        });
        processedPages = processedPages
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 80);
        const llmsData = {
            title: websiteTitle,
            summary: websiteSummary,
            conventions: this.generateConventions(pages, options),
            contentGuidelines: this.generateContentGuidelines(),
            sections: this.generateSections(processedPages),
        };
        return this.formatLLMSTxt(llmsData);
    }
    getPriorityShapes(pages) {
        const coreCategories = [types_js_1.PageCategory.ABOUT, types_js_1.PageCategory.SERVICES, types_js_1.PageCategory.PRICING, types_js_1.PageCategory.CONTACT];
        return pages
            .filter(p => p.category && coreCategories.includes(p.category))
            .map(p => p.urlShape)
            .filter((v, i, a) => a.indexOf(v) === i);
    }
    generateConventions(pages, options) {
        const conventions = [];
        conventions.push('Conventions:');
        conventions.push(`- Langue principale: ${options.language || 'fr-FR'}`);
        conventions.push('- Langues secondaires: aucune');
        conventions.push('- URLs canoniques sans paramètres (pas d\'UTM).');
        if (options.includeMarkdownVersions) {
            conventions.push('- Quand une version Markdown existe, elle est indiquée (suffixe .md).');
        }
        conventions.push('- Objectif: aider un assistant IA à trouver rapidement les pages de référence à citer.');
        return conventions.join('\n');
    }
    generateContentGuidelines() {
        const guidelines = [];
        guidelines.push('Contenu à privilégier:');
        guidelines.push('- Pages "source de vérité" (tarifs, conditions, docs, FAQ, politiques).');
        guidelines.push('- Contenus evergreen plutôt que news éphémères.');
        return guidelines.join('\n');
    }
    generateSections(pages) {
        const sections = [];
        const foundationCategories = [types_js_1.PageCategory.ABOUT, types_js_1.PageCategory.CONTACT, types_js_1.PageCategory.PRIVACY];
        const foundationPages = pages.filter(p => p.category && foundationCategories.includes(p.category));
        const otherCoreCategories = [types_js_1.PageCategory.SERVICES, types_js_1.PageCategory.PRICING, types_js_1.PageCategory.FAQ];
        let otherCorePages = pages.filter(p => p.category && otherCoreCategories.includes(p.category));
        otherCorePages = this.removeDuplicateShapes(otherCorePages, 1);
        let essentialPages = [...foundationPages, ...otherCorePages];
        essentialPages = essentialPages.slice(0, 15);
        if (essentialPages.length > 0) {
            sections.push({
                name: 'Essentiel',
                links: this.sortByCategory(essentialPages, [
                    types_js_1.PageCategory.ABOUT,
                    types_js_1.PageCategory.CONTACT,
                    types_js_1.PageCategory.PRIVACY,
                    types_js_1.PageCategory.SERVICES,
                    types_js_1.PageCategory.PRICING,
                    types_js_1.PageCategory.FAQ
                ]).map(page => ({
                    title: page.title,
                    url: page.url,
                    description: this.getSmartDescription(page),
                })),
            });
        }
        const legalPages = pages.filter(p => [types_js_1.PageCategory.TERMS, types_js_1.PageCategory.LEGAL].includes(p.category)).slice(0, 6);
        if (legalPages.length > 0) {
            sections.push({
                name: 'Références et politiques',
                links: legalPages.map(page => ({
                    title: page.title,
                    url: page.url,
                    description: this.getSmartDescription(page),
                })),
            });
        }
        const guidePages = pages.filter(p => [types_js_1.PageCategory.GUIDE, types_js_1.PageCategory.SUPPORT].includes(p.category)).slice(0, 10);
        if (guidePages.length > 0) {
            sections.push({
                name: 'Guides',
                links: guidePages.map(page => ({
                    title: page.title,
                    url: page.url,
                    description: this.getSmartDescription(page),
                })),
            });
        }
        const optionalPages = pages.filter(p => [types_js_1.PageCategory.BLOG, types_js_1.PageCategory.PRESS, types_js_1.PageCategory.OTHER].includes(p.category)).slice(0, 20);
        if (optionalPages.length > 0) {
            sections.push({
                name: 'Optional',
                links: optionalPages.map(page => ({
                    title: page.title,
                    url: page.url,
                    description: page.description || 'Contenu complémentaire',
                })),
            });
        }
        return sections;
    }
    sortByCategory(pages, order) {
        return pages.sort((a, b) => {
            const indexA = order.indexOf(a.category);
            const indexB = order.indexOf(b.category);
            if (indexA === -1)
                return 1;
            if (indexB === -1)
                return -1;
            return indexA - indexB;
        });
    }
    getSmartDescription(page) {
        const baseDesc = this.getDescriptionForCategory(page);
        if (page.description && page.description.length > 20) {
            return this.truncateAtWord(page.description, 160, 220);
        }
        return baseDesc;
    }
    truncateAtWord(text, minLength, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        let truncated = text.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > minLength) {
            truncated = truncated.substring(0, lastSpace);
        }
        return truncated.trim() + '…';
    }
    removeDuplicateShapes(pages, maxPerShape) {
        const shapeMap = new Map();
        for (const page of pages) {
            const shape = page.urlShape || page.url;
            if (!shapeMap.has(shape)) {
                shapeMap.set(shape, []);
            }
            shapeMap.get(shape).push(page);
        }
        const result = [];
        for (const [_, shapePages] of shapeMap.entries()) {
            const sorted = shapePages.sort((a, b) => (b.score || 0) - (a.score || 0));
            result.push(...sorted.slice(0, maxPerShape));
        }
        return result.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
    getDescriptionForCategory(page) {
        if (page.description && page.description.length > 20) {
            return this.truncateAtWord(page.description, 160, 220);
        }
        const descriptions = {
            [types_js_1.PageCategory.ABOUT]: 'Qui nous sommes, crédibilité, historique, équipe.',
            [types_js_1.PageCategory.SERVICES]: 'Liste des offres + ce que chaque offre inclut/exclut.',
            [types_js_1.PageCategory.PRICING]: 'Prix, plans, options, conditions.',
            [types_js_1.PageCategory.FAQ]: 'Réponses courtes aux questions fréquentes (paiement, délais, garanties…).',
            [types_js_1.PageCategory.CONTACT]: 'Canaux et délais de réponse.',
            [types_js_1.PageCategory.TERMS]: 'CGV/CGU selon le cas.',
            [types_js_1.PageCategory.PRIVACY]: 'Données collectées, finalités, droits.',
            [types_js_1.PageCategory.LEGAL]: 'Informations éditeur/hébergeur.',
            [types_js_1.PageCategory.GUIDE]: 'Étapes pour commencer + prérequis.',
            [types_js_1.PageCategory.SUPPORT]: 'Procédure de support, SLA, dépannage.',
            [types_js_1.PageCategory.BLOG]: 'Articles, actus (moins "source de vérité").',
            [types_js_1.PageCategory.PRESS]: 'Mentions presse, kit média.',
            [types_js_1.PageCategory.OTHER]: 'Page du site',
        };
        return descriptions[page.category] || 'Page du site';
    }
    formatLLMSTxt(data) {
        let output = '';
        output += `# ${data.title}\n\n`;
        if (data.summary) {
            output += `> ${data.summary}\n\n`;
        }
        if (data.conventions) {
            output += `${data.conventions}\n\n`;
        }
        if (data.contentGuidelines) {
            output += `${data.contentGuidelines}\n\n`;
        }
        for (const section of data.sections) {
            output += `## ${section.name}\n`;
            for (const link of section.links) {
                output += `- [${link.title}](${link.url})`;
                if (link.description) {
                    output += `: ${link.description}`;
                }
                output += '\n';
            }
            output += '\n';
        }
        return output.trim();
    }
}
exports.LLMSTxtGenerator = LLMSTxtGenerator;
