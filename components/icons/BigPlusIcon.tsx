import React from 'react';

interface BigPlusIconProps {
  className?: string;
}

const BigPlusIcon: React.FC<BigPlusIconProps> = ({ className }) => {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7v10m-5-5h10" />
    </svg>
  );
};

export default BigPlusIcon;