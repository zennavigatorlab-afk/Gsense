import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 28, showText = true }) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* SVG Brain / Circuit Inspired Monoline Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        {/* Rounded square container boundary */}
        <rect
          x="2"
          y="2"
          width="28"
          height="28"
          rx="6"
          className="stroke-slate-900/10 dark:stroke-slate-700/60 fill-slate-900/5 dark:fill-slate-800/40"
          strokeWidth="1.5"
        />

        {/* 'G' outer circuit contour */}
        <path
          d="M22 11.5C20.5 8.5 16.5 8 13.5 9C10 10.2 8.5 14 9 17.5C9.5 21.2 13 23.5 17 23C20.5 22.5 22.5 19.8 22.5 17H16"
          className="stroke-slate-900 dark:stroke-white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Neural Synapse Circuit Nodes */}
        <circle cx="16" cy="17" r="1.75" className="fill-blue-600 dark:fill-blue-400" />
        <circle cx="22.5" cy="17" r="1.5" className="fill-blue-600 dark:fill-blue-400" />
        <circle cx="22" cy="11.5" r="1.5" className="fill-blue-600 dark:fill-blue-400" />
        <circle cx="13.5" cy="9" r="1.5" className="fill-blue-600 dark:fill-blue-400" />
        <circle cx="9" cy="17.5" r="1.5" className="fill-blue-600 dark:fill-blue-400" />

        {/* Subtle interconnect pulse line */}
        <path
          d="M16 17V12"
          className="stroke-blue-600/70 dark:stroke-blue-400/80"
          strokeWidth="1.5"
          strokeDasharray="2 2"
          strokeLinecap="round"
        />
        <circle cx="16" cy="12" r="1.25" className="fill-blue-600 dark:fill-blue-400" />
      </svg>

      {showText && (
        <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
          G-SENSE
        </span>
      )}
    </div>
  );
};
