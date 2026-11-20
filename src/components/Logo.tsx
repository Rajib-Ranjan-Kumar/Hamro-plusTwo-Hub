import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
  subtitle?: string;
  className?: string;
  to?: string;
}

const sizeConfig = {
  sm: {
    badge: 'w-7 h-7 text-[10px] rounded-[7px]',
    text: 'text-sm font-bold',
    gap: 'gap-2',
    shadow: 'shadow-[0_0_8px_rgba(244,180,0,0.3)]'
  },
  md: {
    badge: 'w-8 h-8 text-xs rounded-lg',
    text: 'text-base font-bold',
    gap: 'gap-2.5',
    shadow: 'shadow-[0_0_10px_rgba(244,180,0,0.35)]'
  },
  lg: {
    badge: 'w-9 h-9 text-sm rounded-xl',
    text: 'text-lg font-bold',
    gap: 'gap-3',
    shadow: 'shadow-[0_0_12px_rgba(244,180,0,0.4)]'
  },
  xl: {
    badge: 'w-12 h-12 text-lg rounded-2xl',
    text: 'text-2xl font-extrabold',
    gap: 'gap-3.5',
    shadow: 'shadow-[0_0_16px_rgba(244,180,0,0.45)]'
  }
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  textClassName = 'text-white tracking-wide',
  subtitle,
  className = '',
  to
}) => {
  const config = sizeConfig[size] || sizeConfig.md;

  const content = (
    <div className={`flex items-center ${config.gap} select-none group shrink-0 ${className}`}>
      {/* Golden +2 Icon Badge */}
      <div
        className={`bg-[#F4B400] text-black font-black flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${config.badge} ${config.shadow}`}
      >
        +2
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <span className={`tracking-wide truncate ${config.text} ${textClassName}`}>
            Hamro +2 Hub
          </span>
          {subtitle && (
            <span className="text-[10px] font-semibold text-[#F5C21B] uppercase tracking-wider -mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex no-underline">
        {content}
      </Link>
    );
  }

  return content;
};
