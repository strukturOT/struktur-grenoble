export interface ShippingSettings {
  amount_cents: number;
  label: string;
}

export const DEFAULT_SHIPPING_LABEL = 'Livraison standard';
const MAX_CENTS = 2147483647;

export function parseShippingSettings(value: unknown): ShippingSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Configuration de livraison invalide.');
  const setting = value as { amount_cents?: unknown; label?: unknown };
  if (!Number.isSafeInteger(setting.amount_cents) || (setting.amount_cents as number) < 0 || (setting.amount_cents as number) > MAX_CENTS) throw new Error('Le tarif de livraison doit être un montant positif ou nul en centimes.');
  if (setting.label !== undefined && typeof setting.label !== 'string') throw new Error('Le libellé de livraison est invalide.');
  return { amount_cents: setting.amount_cents as number, label: (setting.label as string | undefined)?.trim() || DEFAULT_SHIPPING_LABEL };
}

export function shippingSettingsFromInput(amount: string, label: string): ShippingSettings {
  const normalized = amount.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error('Saisissez un montant en euros positif ou nul, avec deux décimales au maximum.');
  const [euros, decimals = ''] = normalized.split('.');
  return parseShippingSettings({ amount_cents: Number(euros) * 100 + Number(decimals.padEnd(2, '0')), label });
}

/** Missing settings preserve the legacy fee; malformed settings and read failures never become free shipping. */
export async function resolveShippingSettings(
  readSetting: () => Promise<{ value: unknown } | null>,
  legacyAmount?: string,
  legacyLabel?: string,
): Promise<ShippingSettings> {
  const stored = await readSetting();
  if (stored !== null) return parseShippingSettings(stored.value);
  if (legacyAmount && !/^\d+$/.test(legacyAmount)) throw new Error('Configuration de livraison invalide.');
  return parseShippingSettings({ amount_cents: legacyAmount ? Number(legacyAmount) : 0, label: legacyLabel });
}
