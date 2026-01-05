import { PageMetadata, LLMSData, PageCategory, GeneratorOptions } from './types.js';
import { PageScorer } from './scorer.js';
import { PageClusterer } from './clusterer.js';

export class LLMSTxtGenerator {
  private scorer = new PageScorer();
  private clusterer = new PageClusterer();

  generate(pages: PageMetadata[], websiteTitle: string, websiteSummary: string, options: GeneratorOptions = {}): string {
    let processedPages = this.scorer.scorePages(pages);
    
    processedPages = this.clusterer.cluster(processedPages, {
      maxPerCluster: 3,
      priorityShapes: this.getPriorityShapes(processedPages),
    });

    processedPages = processedPages
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 80);

    const llmsData: LLMSData = {
      title: websiteTitle,
      summary: websiteSummary,
      conventions: this.generateConventions(pages, options),
      contentGuidelines: this.generateContentGuidelines(),
      sections: this.generateSections(processedPages),
    };

    return this.formatLLMSTxt(llmsData);
  }

  private getPriorityShapes(pages: PageMetadata[]): string[] {
    const coreCategories = [PageCategory.ABOUT, PageCategory.SERVICES, PageCategory.PRICING, PageCategory.CONTACT];
    return pages
      .filter(p => p.category && coreCategories.includes(p.category))
      .map(p => p.urlShape!)
      .filter((v, i, a) => a.indexOf(v) === i);
  }

  private generateConventions(pages: PageMetadata[], options: GeneratorOptions): string {
    const conventions: string[] = [];
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

  private generateContentGuidelines(): string {
    const guidelines: string[] = [];
    guidelines.push('Contenu à privilégier:');
    guidelines.push('- Pages "source de vérité" (tarifs, conditions, docs, FAQ, politiques).');
    guidelines.push('- Contenus evergreen plutôt que news éphémères.');
    return guidelines.join('\n');
  }

  private generateSections(pages: PageMetadata[]): Array<{ name: string; links: Array<{ title: string; url: string; description: string }> }> {
    const sections = [];

    const foundationCategories = [PageCategory.ABOUT, PageCategory.CONTACT, PageCategory.PRIVACY];
    const foundationPages = pages.filter(p => p.category && foundationCategories.includes(p.category));
    
    const otherCoreCategories = [PageCategory.SERVICES, PageCategory.PRICING, PageCategory.FAQ];
    let otherCorePages = pages.filter(p => p.category && otherCoreCategories.includes(p.category));
    otherCorePages = this.removeDuplicateShapes(otherCorePages, 1);
    
    let essentialPages = [...foundationPages, ...otherCorePages];
    essentialPages = essentialPages.slice(0, 15);
    
    if (essentialPages.length > 0) {
      sections.push({
        name: 'Essentiel',
        links: this.sortByCategory(essentialPages, [
          PageCategory.ABOUT,
          PageCategory.CONTACT,
          PageCategory.PRIVACY,
          PageCategory.SERVICES,
          PageCategory.PRICING,
          PageCategory.FAQ
        ]).map(page => ({
          title: page.title,
          url: page.url,
          description: this.getSmartDescription(page),
        })),
      });
    }

    const legalPages = pages.filter(p => 
      [PageCategory.TERMS, PageCategory.LEGAL].includes(p.category!)
    ).slice(0, 6);
    
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

    const guidePages = pages.filter(p => 
      [PageCategory.GUIDE, PageCategory.SUPPORT].includes(p.category!)
    ).slice(0, 10);
    
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

    const optionalPages = pages.filter(p => 
      [PageCategory.BLOG, PageCategory.PRESS, PageCategory.OTHER].includes(p.category!)
    ).slice(0, 20);
    
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

  private sortByCategory(pages: PageMetadata[], order: PageCategory[]): PageMetadata[] {
    return pages.sort((a, b) => {
      const indexA = order.indexOf(a.category!);
      const indexB = order.indexOf(b.category!);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }

  private getSmartDescription(page: PageMetadata): string {
    const baseDesc = this.getDescriptionForCategory(page);
    
    if (page.description && page.description.length > 20) {
      return this.truncateAtWord(page.description, 160, 220);
    }
    
    return baseDesc;
  }

  private truncateAtWord(text: string, minLength: number, maxLength: number): string {
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

  private removeDuplicateShapes(pages: PageMetadata[], maxPerShape: number): PageMetadata[] {
    const shapeMap = new Map<string, PageMetadata[]>();
    
    for (const page of pages) {
      const shape = page.urlShape || page.url;
      if (!shapeMap.has(shape)) {
        shapeMap.set(shape, []);
      }
      shapeMap.get(shape)!.push(page);
    }

    const result: PageMetadata[] = [];
    for (const [_, shapePages] of shapeMap.entries()) {
      const sorted = shapePages.sort((a, b) => (b.score || 0) - (a.score || 0));
      result.push(...sorted.slice(0, maxPerShape));
    }

    return result.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  private getDescriptionForCategory(page: PageMetadata): string {
    if (page.description && page.description.length > 20) {
      return this.truncateAtWord(page.description, 160, 220);
    }

    const descriptions: Record<PageCategory, string> = {
      [PageCategory.ABOUT]: 'Qui nous sommes, crédibilité, historique, équipe.',
      [PageCategory.SERVICES]: 'Liste des offres + ce que chaque offre inclut/exclut.',
      [PageCategory.PRICING]: 'Prix, plans, options, conditions.',
      [PageCategory.FAQ]: 'Réponses courtes aux questions fréquentes (paiement, délais, garanties…).',
      [PageCategory.CONTACT]: 'Canaux et délais de réponse.',
      [PageCategory.TERMS]: 'CGV/CGU selon le cas.',
      [PageCategory.PRIVACY]: 'Données collectées, finalités, droits.',
      [PageCategory.LEGAL]: 'Informations éditeur/hébergeur.',
      [PageCategory.GUIDE]: 'Étapes pour commencer + prérequis.',
      [PageCategory.SUPPORT]: 'Procédure de support, SLA, dépannage.',
      [PageCategory.BLOG]: 'Articles, actus (moins "source de vérité").',
      [PageCategory.PRESS]: 'Mentions presse, kit média.',
      [PageCategory.OTHER]: 'Page du site',
    };

    return descriptions[page.category!] || 'Page du site';
  }

  private formatLLMSTxt(data: LLMSData): string {
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
