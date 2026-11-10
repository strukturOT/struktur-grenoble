import type { NewProductInput, ProductStatus, StoreProduct } from './commerce';
export interface AdminCatalogFilters {
  status?: 'all' | ProductStatus;
  stock?: 'all' | 'available' | 'empty';
  query?: string;
}
export function hasCatalogImage(product: Pick<StoreProduct, 'images'> | null | undefined): boolean;
export function filterAdminCatalog(products: StoreProduct[], filters?: AdminCatalogFilters): StoreProduct[];
export function saveProductWithPhotoGuard(product: Pick<StoreProduct, 'images'> | null, input: NewProductInput, newImage: File | null, save: (input: NewProductInput) => Promise<string>, publish: (productId: string) => Promise<void>): Promise<string>;
