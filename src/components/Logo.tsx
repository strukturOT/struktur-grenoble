import React from 'react';

type LogoProps = {
  variant?: 'wordmark' | 'mark';
  className?: string;
};

export const Logo: React.FC<LogoProps> = ({ variant = 'wordmark', className = '' }) => {
  if (variant === 'mark') {
    return (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 200 200" 
        className={`w-auto ${className}`}
      >
        <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="8"/>
        <text x="100" y="85" dominantBaseline="middle" textAnchor="middle" fill="currentColor" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="44" letterSpacing="0">STRU</text>
        <text x="100" y="125" dominantBaseline="middle" textAnchor="middle" fill="currentColor" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="44" letterSpacing="0">KTUR</text>
      </svg>
    );
  }

  // Wordmark
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 300 64"
      role="img"
      aria-label="STRUKTUR"
      className={`w-auto ${className}`}
    >
      <text 
        x="50%" 
        y="52%"
        dominantBaseline="middle" 
        textAnchor="middle" 
        fill="currentColor" 
        fontFamily="Inter, 'Helvetica Neue', Arial, sans-serif"
        fontWeight="800" 
        fontSize="54"
        letterSpacing="-1.5"
      >
        STRUKTUR
      </text>
    </svg>
  );
};
