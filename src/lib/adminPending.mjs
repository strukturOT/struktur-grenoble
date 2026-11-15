import { filterAdminCatalog, hasCatalogImage } from './adminCatalog.mjs';

export const editableVariantColor = (attributes = {}) => String(typeof attributes.colorway === 'string' ? attributes.colorway : attributes.color ?? '');
export const variantColor = (attributes = {}) => editableVariantColor(attributes).trim();
export const isImportedVariant = (variant) => Boolean(variant.attributes?.import_status);
export const canRemoveDraftVariant = (variant) => !(variant.variantId && isImportedVariant(variant));
const availableImports = (product) => product.variants.filter((variant) => variant.stockQuantity > 0 && isImportedVariant(variant));

export function pendingReasons(product) {
  const reasons = [];
  const imported = availableImports(product);
  if (imported.some((variant) => !variantColor(variant.attributes))) reasons.push({ key: 'color', label: 'Coloris à renseigner' });
  if (!hasCatalogImage(product)) reasons.push({ key: 'photo', label: 'Photo du bon modèle à ajouter' });
  if (imported.some((variant) => variant.attributes.import_status !== 'verified')) reasons.push({ key: 'identity', label: 'Modèle et coloris à confirmer' });
  if (!reasons.length) reasons.push({ key: 'publish', label: 'Fiche prête à relire puis publier' });
  return reasons;
}

export function pendingProducts(products, { query = '', reason = 'all', brand = 'all' } = {}) {
  return filterAdminCatalog(products, { query, status: 'draft', stock: 'available' })
    .filter((product) => brand === 'all' || product.brand === brand)
    .map((product) => ({ product, reasons: pendingReasons(product), stock: product.variants.reduce((sum, variant) => sum + variant.stockQuantity, 0), notes: [...new Set(product.variants.filter((variant) => variant.stockQuantity > 0).map((variant) => variant.attributes.import_notes).filter(Boolean))] }))
    .filter((item) => reason === 'all' || item.reasons.some((current) => current.key === reason));
}

/** Changing a merchant color preserves source metadata and requires a new imported identity check. */
export function editVariantColor(attributes, value) {
  if (value.trim() === variantColor(attributes)) return { ...attributes, colorway: value };
  if (!attributes.import_status) return { ...attributes, colorway: value };
  const { media_verification, admin_confirmation, ...source } = attributes;
  const previous = media_verification || admin_confirmation ? [{ previous_color: variantColor(attributes), ...(media_verification ? { media_verification } : {}), ...(admin_confirmation ? { admin_confirmation } : {}) }] : [];
  return {
    ...source,
    colorway: value,
    ...(previous.length ? { verification_history: [...(Array.isArray(attributes.verification_history) ? attributes.verification_history : []), ...previous] } : {}),
    ...(attributes.import_notes && !attributes.import_notes_before_color_change ? { import_notes_before_color_change: attributes.import_notes } : {}),
    import_status: 'identity_review',
    import_notes: 'Coloris modifié : vérifiez le modèle, le nom de la fiche et les photographies avant de confirmer à nouveau.',
  };
}

/** Human confirmation never publishes a product or changes inventory/prices. */
export function confirmImportedVariants(variants, { confirmed = false, hasPhoto = false, publish = false, confirmedAt = new Date().toISOString() } = {}) {
  const imported = variants.filter((variant) => variant.stockQuantity > 0 && isImportedVariant(variant));
  const missingColor = imported.some((variant) => !variantColor(variant.attributes));
  const needsConfirmation = imported.some((variant) => variant.attributes.import_status !== 'verified');
  if (publish && missingColor) throw new Error('Renseignez le coloris des variantes en stock avant de publier.');
  if (publish && needsConfirmation && !confirmed) throw new Error('Confirmez le modèle, le coloris et les photographies avant de publier cette fiche importée.');
  if (confirmed && needsConfirmation && (missingColor || !hasPhoto)) throw new Error('Ajoutez le coloris et une photo du bon modèle avant de confirmer la fiche.');
  if (!confirmed || !needsConfirmation) return variants;
  return variants.map((variant) => variant.stockQuantity > 0 && isImportedVariant(variant) ? {
    ...variant,
    attributes: {
      ...variant.attributes,
      ...(variant.attributes.import_notes && !variant.attributes.import_notes_before_confirmation ? { import_notes_before_confirmation: variant.attributes.import_notes } : {}),
      import_status: 'verified',
      import_notes: 'Modèle, coloris et photographies confirmés dans l’administration.',
      admin_confirmation: { confirmed_at: confirmedAt, method: 'explicit_checkbox', confirmed_color: variantColor(variant.attributes) },
    },
  } : variant);
}
