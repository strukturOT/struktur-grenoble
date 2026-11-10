import publicConfig from '../.seo/public-config.json';
import collectionContent from '../scripts/data/collection-content.json';
import { createLiveSeoHandlers } from './live-seo.mjs';

const handlers = createLiveSeoHandlers(publicConfig, { collectionContent });
export const productPage = (context) => handlers.product(context);
export const categoryPage = (context) => handlers.category(context);
export const sitemapIndex = (context) => handlers.sitemap(context, 'index');
export const sitemapProducts = (context) => handlers.sitemap(context, 'products');
export const sitemapCategories = (context) => handlers.sitemap(context, 'categories');
export const htmlSitemap = (context) => handlers.htmlSitemap(context);
