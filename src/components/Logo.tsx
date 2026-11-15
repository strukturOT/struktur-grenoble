type LogoProps = {
  variant?: 'wordmark' | 'mark';
  className?: string;
};

/** Supplied lettering with a transparent background and clean orange edges. */
export const Logo = ({ variant = 'wordmark', className = '' }: LogoProps) => (
  <img
    src={variant === 'mark' ? '/brand/struktur-mark.svg?v=transparent-20261115' : '/brand/struktur-lockup.svg?v=transparent-20261115'}
    alt={variant === 'mark' ? 'STRUKTUR' : 'STRUKTUR //KULTUR'}
    width={variant === 'mark' ? 200 : 1310}
    height={variant === 'mark' ? 200 : 239}
    className={`block h-auto ${className}`}
  />
);
