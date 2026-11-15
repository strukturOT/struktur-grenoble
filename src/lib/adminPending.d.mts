import type { ProductVariant, StoreProduct } from './commerce';
export type PendingReasonKey = 'color' | 'photo' | 'identity' | 'publish';
export interface PendingReason { key: PendingReasonKey; label: string }
export interface PendingItem { product: StoreProduct; reasons: PendingReason[]; stock: number; notes: string[] }
export function variantColor(attributes: ProductVariant['attributes']): string;
export function editableVariantColor(attributes: ProductVariant['attributes']): string;
export function isImportedVariant(variant: Pick<ProductVariant, 'attributes'>): boolean;
export function canRemoveDraftVariant(variant: Pick<ProductVariant, 'attributes'> & { variantId?: string }): boolean;
export function pendingReasons(product: Pick<StoreProduct, 'variants' | 'images'>): PendingReason[];
export function pendingProducts(products: StoreProduct[], filters?: { query?: string; reason?: 'all' | PendingReasonKey; brand?: string }): PendingItem[];
export function editVariantColor(attributes: ProductVariant['attributes'], value: string): ProductVariant['attributes'];
export function confirmImportedVariants<T extends { stockQuantity: number; attributes?: ProductVariant['attributes'] }>(variants: T[], options?: { confirmed?: boolean; hasPhoto?: boolean; publish?: boolean; confirmedAt?: string }): T[];
