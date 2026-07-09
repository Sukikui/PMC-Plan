import React from 'react';

interface MapIconProps {
  className?: string;
}

export default function MapIcon({ className = '' }: MapIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l-6 3V6l6-3m0 15l6 3m-6-3V3m6 18l6-3V3l-6 3m0 15V6m0 0L9 3" />
    </svg>
  );
}
