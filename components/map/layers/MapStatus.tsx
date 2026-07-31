import type React from 'react';

interface MapStatusProps {
  children: React.ReactNode;
  className: string;
}

export default function MapStatus({ children, className }: MapStatusProps) {
  return (
    <div className={`absolute inset-0 z-40 flex items-center justify-center px-6 text-center ${className}`}>
      {children}
    </div>
  );
}
