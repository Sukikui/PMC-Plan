import React from 'react';

interface TargetIconProps {
  className?: string;
}

const TargetIcon: React.FC<TargetIconProps> = ({ className }) => {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
};

export default TargetIcon;
