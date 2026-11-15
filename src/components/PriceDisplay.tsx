import { formatMoney } from '../lib/commerce';

type PriceDisplayProps = {
  priceCents: number;
  originalPriceCents?: number;
  currency?: string;
  from?: boolean;
  badge?: boolean;
  className?: string;
};

export default function PriceDisplay({ priceCents, originalPriceCents, currency = 'EUR', from = false, badge = false, className = '' }: PriceDisplayProps) {
  const discounted = Number.isInteger(originalPriceCents) && (originalPriceCents ?? 0) > priceCents && priceCents > 0;
  const percentage = discounted ? Math.min(99, Math.round(((originalPriceCents ?? 0) - priceCents) * 100 / (originalPriceCents ?? 1))) : 0;
  return <span className={`inline-flex flex-wrap items-baseline gap-x-2 gap-y-1 ${className}`}>
    {from && <span className="text-[0.8em] font-normal text-theme-ink/65">À partir de</span>}
    {discounted && <del className="text-[0.8em] font-normal text-theme-ink/50"><span className="sr-only">Prix habituel : </span>{formatMoney(originalPriceCents!, currency)}</del>}
    <span className={discounted ? 'font-semibold text-struktur-orange' : ''}>{discounted && <span className="sr-only">Prix promotionnel : </span>}{formatMoney(priceCents, currency)}</span>
    {discounted && badge && <span className="self-center bg-struktur-orange px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-white">{percentage > 0 ? `−${percentage} %` : 'Promotion'}</span>}
  </span>;
}
