import type { SVGProps } from 'react';

export default function RefreshIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 11a8 8 0 1 0-2.34 5.66M20 11V5m0 6h-6"
      />
    </svg>
  );
}
