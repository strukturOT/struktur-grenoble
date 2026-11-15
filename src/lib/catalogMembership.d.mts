type Category = { id: string; slug: string };
type MembershipProduct = { isOutlet?: boolean; is_outlet?: boolean; category_id?: string | null; category?: Category | null; categories?: Category | null; brand?: string | null };
export function isOutletProduct(product: MembershipProduct | null | undefined, category?: Category | null): boolean;
export function productInCategory(product: MembershipProduct | null | undefined, category: Category | null | undefined): boolean;
