"use client";

import React from 'react';

interface EnchantedImageProps {
  src: string;
  alt: string;
  className?: string; // apply width/height like w-8 h-8
  rounded?: boolean;
  enchanted?: boolean;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

const EnchantedImage: React.FC<EnchantedImageProps> = ({ src, alt, className = 'w-8 h-8', rounded = true, enchanted = false, onError }) => {
  return (
    <div className={`relative ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`${className} object-contain ${rounded ? 'rounded-sm' : ''}`}
        style={{ imageRendering: 'pixelated' }}
        onError={onError}
      />
      {enchanted && (
        <span
          className="mc-glint"
          style={{
            WebkitMaskImage: `url(${src})`,
            maskImage: `url(${src})`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
          }}
        />
      )}
    </div>
  );
};

export default EnchantedImage;

