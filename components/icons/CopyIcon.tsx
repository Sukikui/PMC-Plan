import React from 'react';

interface CopyIconProps {
  className?: string;
}

const CopyIcon: React.FC<CopyIconProps> = ({ className }) => {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 8h10a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V10a2 2 0 012-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8V4a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h2" />
    </svg>
  );
};

export default CopyIcon;
