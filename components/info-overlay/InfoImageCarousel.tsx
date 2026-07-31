'use client';

import type { CSSProperties } from 'react';
import IconActionButton from '@/components/ui/IconActionButton';
import { themeColors } from '@/lib/theme-colors';
import { useImageCarousel } from './useImageCarousel';

export interface InfoCarouselImage {
  alt: string;
  caption?: string;
  id: string;
  src: string;
}

interface InfoImageCarouselProps {
  carouselId: string;
  images: InfoCarouselImage[];
}

export default function InfoImageCarousel({
  carouselId,
  images,
}: InfoImageCarouselProps) {
  const hasMultipleImages = images.length > 1;
  const carousel = useImageCarousel(carouselId, images.length);

  if (images.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className={`relative overflow-hidden ${themeColors.infoOverlay.imageFrame} ${themeColors.util.roundedLg}`}>
        <div
          ref={carousel.carouselRef}
          onScroll={carousel.handleScroll}
          onPointerDown={carousel.handlePointerDown}
          onPointerMove={carousel.handlePointerMove}
          onPointerUp={carousel.handlePointerEnd}
          onPointerCancel={carousel.handlePointerEnd}
          onPointerLeave={carousel.handlePointerEnd}
          className="flex h-72 cursor-grab snap-x snap-mandatory overflow-x-auto scroll-smooth active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
          style={hasMultipleImages ? carouselEdgeMask : hiddenScrollbar}
        >
          {images.map((image) => (
            <div
              key={image.id}
              className="flex min-w-full snap-center items-center justify-center px-3"
            >
              <div className="relative flex h-72 max-w-full items-center justify-center overflow-hidden">
                <img
                  src={image.src}
                  alt={image.alt}
                  draggable={false}
                  className={`h-72 w-auto max-w-full object-contain ${themeColors.util.roundedLg}`}
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
                {image.caption && (
                  <span className={`absolute bottom-2 left-1/2 max-w-[calc(100%-1rem)] -translate-x-1/2 truncate px-2.5 py-1 text-xs font-medium ${themeColors.util.roundedFull} ${themeColors.panel.tertiary} ${themeColors.blurSm} ${themeColors.text.secondary}`}>
                    {image.caption}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {hasMultipleImages && (
          <>
            <CarouselArrow
              direction="prev"
              onClick={() => carousel.scrollByDirection(-1)}
            />
            <CarouselArrow
              direction="next"
              onClick={() => carousel.scrollByDirection(1)}
            />
          </>
        )}
      </div>

      {hasMultipleImages && (
        <div className="flex items-center justify-center gap-2">
          {images.map((image, index) => (
            <button
              key={`dot-${image.id}`}
              type="button"
              onClick={() => carousel.scrollToIndex(index)}
              className={`h-1.5 ${carousel.activeIndex === index ? `w-5 ${themeColors.infoOverlay.imageDotActive}` : `w-1.5 ${themeColors.infoOverlay.imageDotInactive}`} ${themeColors.util.roundedFull} ${themeColors.transitionAll}`}
              aria-label={`Afficher l’image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const hiddenScrollbar: CSSProperties = {
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
};

const carouselEdgeMask: CSSProperties = {
  ...hiddenScrollbar,
  WebkitMaskImage: 'linear-gradient(to right, transparent 0, black 1.75rem, black calc(100% - 1.75rem), transparent 100%)',
  maskImage: 'linear-gradient(to right, transparent 0, black 1.75rem, black calc(100% - 1.75rem), transparent 100%)',
};

function CarouselArrow({
  direction,
  onClick,
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
}) {
  const isPrev = direction === 'prev';

  return (
    <IconActionButton
      type="button"
      onClick={onClick}
      className={`absolute ${isPrev ? 'left-3' : 'right-3'} top-1/2 z-10 -translate-y-1/2`}
      aria-label={isPrev ? 'Image précédente' : 'Image suivante'}
    >
      <svg
        className={`h-4 w-4 ${themeColors.text.secondary}`}
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          d={isPrev ? 'M12.5 4.5 7 10l5.5 5.5' : 'M7.5 4.5 13 10l-5.5 5.5'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </IconActionButton>
  );
}
