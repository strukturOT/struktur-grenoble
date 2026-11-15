import type { NewProductInput } from './commerce';
export function variantWriteValues(variant: NewProductInput['variants'][number], position: number): { name: string | null; sku: string; price_cents?: number | null; stock_quantity?: number; attributes: NonNullable<NewProductInput['variants'][number]['attributes']>; position: number };
