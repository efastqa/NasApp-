import React from 'react';

interface NasappBrandLogoProps {
  className?: string;
  size?: number | string;
  theme?: 'light' | 'dark';
}

export const NasappBrandLogo: React.FC<NasappBrandLogoProps> = ({ 
  className = 'w-9 h-9',
  size,
  theme = 'light'
}) => {
  const style = size ? { width: size, height: size } : undefined;
  const isLight = theme === 'light';

  return (
    <svg 
      className={`shrink-0 select-none ${className}`} 
      style={style}
      viewBox="0 0 256 256" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`bgIconMark_${theme}`} x1="0" y1="0" x2="1" y2="1">
          {isLight ? (
            <>
              <stop offset="0%" stopColor="#064E3B" />
              <stop offset="100%" stopColor="#022C22" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#0A0A0B" />
              <stop offset="100%" stopColor="#000000" />
            </>
          )}
        </linearGradient>
        <linearGradient id={`markIconGlow_${theme}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#39FFB0" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <filter id={`glowMark_${theme}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#39FFB0" floodOpacity={isLight ? "0.45" : "0.35"} />
        </filter>
      </defs>
      <rect width="256" height="256" rx="64" fill={`url(#bgIconMark_${theme})`} />
      <rect x="1.5" y="1.5" width="253" height="253" rx="62.5" fill="none" stroke={isLight ? "#10B981" : "#1E1E21"} strokeWidth={isLight ? "3" : "1.5"} strokeOpacity={isLight ? "0.4" : "1"} />
      <circle cx="196" cy="60" r="8" fill="#39FFB0" filter={`url(#glowMark_${theme})`} />
      <g filter={`url(#glowMark_${theme})`}>
        <line x1="82" y1="76" x2="174" y2="180" stroke={`url(#markIconGlow_${theme})`} strokeWidth="30" strokeLinecap="round" />
        <rect x="66" y="64" width="32" height="128" rx="16" fill={`url(#markIconGlow_${theme})`} />
        <rect x="158" y="64" width="32" height="128" rx="16" fill={`url(#markIconGlow_${theme})`} />
      </g>
    </svg>
  );
};

export default NasappBrandLogo;
