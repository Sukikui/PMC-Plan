'use client';

import IconActionButton from '@/components/ui/IconActionButton';
import { themeColors } from '@/lib/theme-colors';
import { usePlaceImageCarousel } from './usePlaceImageCarousel';

interface PlaceImageCarouselProps {
  images: string[];
  itemId: string;
  itemName: string;
}

export default function PlaceImageCarousel({ images, itemId, itemName }: PlaceImageCarouselProps) {
  const hasMultipleImages = images.length > 1;
  const {
    activeIndex,
    carouselRef,
    handlePointerDown,
    handlePointerEnd,
    handlePointerMove,
    handleScroll,
    scrollByDirection,
    scrollToIndex,
  } = usePlaceImageCarousel(itemId, images.length);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className={`relative overflow-hidden ${themeColors.infoOverlay.imageFrame} ${themeColors.util.roundedLg}`}>
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
          className="flex h-72 cursor-grab snap-x snap-mandatory overflow-x-auto scroll-smooth active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            ...(hasMultipleImages
              ? {
                  WebkitMaskImage: 'linear-gradient(to right, transparent 0, black 1.75rem, black calc(100% - 1.75rem), transparent 100%)',
                  maskImage: 'linear-gradient(to right, transparent 0, black 1.75rem, black calc(100% - 1.75rem), transparent 100%)',
                }
              : {}),
          }}
        >
          {images.map((image, index) => (
            <div key={`${image}-${index}`} className="flex min-w-full snap-center items-center justify-center px-3">
              <img
                src={image}
                alt={`Image ${index + 1} de ${itemName}`}
                draggable={false}
                className={`h-72 w-auto max-w-full object-contain ${themeColors.util.roundedLg}`}
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>

        {hasMultipleImages && (
          <>
            <CarouselArrow direction="prev" onClick={() => scrollByDirection(-1)} />
            <CarouselArrow direction="next" onClick={() => scrollByDirection(1)} />
          </>
        )}
      </div>

      {hasMultipleImages && (
        <div className="flex items-center justify-center gap-2">
          {images.map((image, index) => (
            <button
              key={`dot-${image}-${index}`}
              type="button"
              onClick={() => scrollToIndex(index)}
              className={`h-1.5 ${activeIndex === index ? `w-5 ${themeColors.infoOverlay.imageDotActive}` : `w-1.5 ${themeColors.infoOverlay.imageDotInactive}`} ${themeColors.util.roundedFull} ${themeColors.transitionAll}`}
              aria-label={`Afficher l'image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CarouselArrow({ direction, onClick }: { direction: 'prev' | 'next'; onClick: () => void }) {
  const isPrev = direction === 'prev';

  return (
    <IconActionButton
      type="button"
      onClick={onClick}
      className={`absolute ${isPrev ? 'left-3' : 'right-3'} top-1/2 z-10 -translate-y-1/2`}
      aria-label={isPrev ? 'Image précédente' : 'Image suivante'}
    >
      <svg className={`h-4 w-4 ${themeColors.text.secondary}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d={isPrev ? 'M12.5 4.5 7 10l5.5 5.5' : 'M7.5 4.5 13 10l-5.5 5.5'} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </IconActionButton>
  );
}

