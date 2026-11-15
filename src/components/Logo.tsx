type LogoProps = {
  variant?: 'wordmark' | 'mark';
  className?: string;
};

/** Client artwork from 12 November 2026; no font substitution or recoloring. */
export const Logo = ({ variant = 'wordmark', className = '' }: LogoProps) => (
  <img
    src={variant === 'mark' ? '/brand/struktur-mark.svg' : '/brand/struktur-lockup.svg'}
    alt={variant === 'mark' ? 'STRUKTUR' : 'STRUKTUR //KULTUR'}
    width={variant === 'mark' ? 200 : 1310}
    height={variant === 'mark' ? 200 : 239}
    className={`block h-auto ${className}`}
  />
);
