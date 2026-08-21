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
        <text x="100" y="85" dominantBaseline="middle" textAnchor="middle" fill="currentColor" fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" fontWeight="900" fontSize="42" letterSpacing="4">STRU</text>
        <text x="100" y="125" dominantBaseline="middle" textAnchor="middle" fill="currentColor" fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" fontWeight="900" fontSize="42" letterSpacing="4">KTUR</text>
      </svg>
    );
  }

  // Wordmark
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 400 80" 
      className={`w-auto ${className}`}
    >
      <text 
        x="50%" 
        y="55%" 
        dominantBaseline="middle" 
        textAnchor="middle" 
        fill="currentColor" 
        fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
        fontWeight="800" 
        fontSize="52" 
        letterSpacing="8"
      >
        STRUKTUR
      </text>
    </svg>
  );
};
