export interface PageMetadata {
  url: string;
  title: string;
  description: string;
  content?: string;
  category?: PageCategory;
  depth?: number;
  inlinks?: number;
  hasNoIndex?: boolean;
  canonicalUrl?: string;
  structuredData?: string[];
  isInMenu?: boolean;
  score?: number;
  urlShape?: string;
}

export interface CrawlerOptions {
  maxPages?: number;
  maxDepth?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
  followExternal?: boolean;
}

export interface LLMSSection {
  name: string;
  links: Array<{
    title: string;
    url: string;
    description: string;
  }>;
}

export interface LLMSData {
  title: string;
  summary: string;
  conventions: string;
  contentGuidelines: string;
  sections: LLMSSection[];
}

export interface GeneratorOptions {
  language?: string;
  includeMarkdownVersions?: boolean;
  customConventions?: string;
}

export enum PageCategory {
  ABOUT = 'about',
  SERVICES = 'services',
  PRICING = 'pricing',
  FAQ = 'faq',
  CONTACT = 'contact',
  LEGAL = 'legal',
  PRIVACY = 'privacy',
  TERMS = 'terms',
  GUIDE = 'guide',
  SUPPORT = 'support',
  BLOG = 'blog',
  PRESS = 'press',
  OTHER = 'other'
}
