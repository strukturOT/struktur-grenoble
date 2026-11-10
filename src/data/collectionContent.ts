import content from '../../scripts/data/collection-content.json';

export interface CollectionContent {
  name: string;
  title: string;
  description: string;
  intro: string;
  detail: string;
  relatedSlugs: string[];
}

export const collectionContent: Record<string, CollectionContent> = content;
