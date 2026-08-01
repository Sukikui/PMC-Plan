'use client';

import {
  startTransition,
  useEffect,
  useState,
  type ReactNode,
  type Ref,
} from 'react';
import OverlayTabs, {
  type OverlayTabOption,
} from '@/components/ui/OverlayTabs';
import { themeColors } from '@/lib/theme-colors';
import { OVERLAY_TRANSITION_MS } from '@/lib/ui/overlay';

export interface OverlaySlide<T extends string> {
  className?: string;
  content: ReactNode;
  elementRef?: Ref<HTMLDivElement>;
  value: T;
}

interface OverlaySlideTrackProps<T extends string> {
  activeValue: T;
  baseSlideClassName?: string;
  slides: readonly OverlaySlide<T>[];
}

export function OverlaySlideTrack<T extends string>({
  activeValue,
  baseSlideClassName = '',
  slides,
}: OverlaySlideTrackProps<T>) {
  const slideCount = Math.max(1, slides.length);
  const [mountedValues, setMountedValues] = useState<Set<T>>(
    () => new Set([activeValue]),
  );
  const activeIndex = Math.max(
    0,
    slides.findIndex((slide) => slide.value === activeValue),
  );

  useEffect(() => {
    startTransition(() => {
      setMountedValues((current) => {
        if (current.has(activeValue)) return current;
        return new Set([...current, activeValue]);
      });
    });
  }, [activeValue]);

  useEffect(() => {
    const pendingValues = slides
      .map((slide) => slide.value)
      .filter((value) => value !== activeValue);
    let idleCallbackId: number | null = null;
    let preloadTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const mountNextSlide = () => {
      const nextValue = pendingValues.shift();
      if (!nextValue) return;

      startTransition(() => {
        setMountedValues((current) => {
          if (current.has(nextValue)) return current;
          return new Set([...current, nextValue]);
        });
      });

      if (pendingValues.length > 0) {
        scheduleNextMount();
      }
    };

    const scheduleNextMount = () => {
      if ('requestIdleCallback' in window) {
        idleCallbackId = window.requestIdleCallback(mountNextSlide);
        return;
      }

      preloadTimeoutId = setTimeout(mountNextSlide, 50);
    };

    preloadTimeoutId = setTimeout(scheduleNextMount, OVERLAY_TRANSITION_MS);

    return () => {
      if (preloadTimeoutId !== null) {
        clearTimeout(preloadTimeoutId);
      }
      if (idleCallbackId !== null) {
        window.cancelIdleCallback(idleCallbackId);
      }
    };
  }, [activeValue, slides]);

  return (
    <div
      className="flex h-full transition-transform duration-300 ease-in-out"
      style={{
        width: `${slideCount * 100}%`,
        transform: `translateX(-${activeIndex * (100 / slideCount)}%)`,
      }}
    >
      {slides.map((slide) => {
        const active = slide.value === activeValue;
        return (
          <div
            key={slide.value}
            ref={slide.elementRef}
            aria-hidden={!active}
            className={`min-w-0 shrink-0 ${
              active ? '' : 'pointer-events-none'
            } ${baseSlideClassName} ${slide.className ?? ''}`}
            style={{
              contain: 'layout paint style',
              width: `${100 / slideCount}%`,
            }}
          >
            {(active || mountedValues.has(slide.value)) ? slide.content : null}
          </div>
        );
      })}
    </div>
  );
}

interface OverlaySliderProps<T extends string> {
  activeValue: T;
  onChange: (value: T) => void;
  slides: readonly OverlaySlide<T>[];
  tabs: readonly OverlayTabOption<T>[];
}

export default function OverlaySlider<T extends string>({
  activeValue,
  onChange,
  slides,
  tabs,
}: OverlaySliderProps<T>) {
  return (
    <div className="relative h-full overflow-hidden">
      <OverlayTabs
        activeValue={activeValue}
        onChange={onChange}
        options={tabs}
      />
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2 ${themeColors.gradient.bottomSolid} ${themeColors.transition}`} />
      <div className={`pointer-events-none absolute inset-x-0 bottom-2 z-10 h-8 ${themeColors.gradient.bottomBlur} ${themeColors.transition}`} />
      <OverlaySlideTrack
        activeValue={activeValue}
        baseSlideClassName={`h-full overflow-y-auto px-6 pb-14 ${themeColors.panel.primary} ${themeColors.transition} [&::-webkit-scrollbar]:hidden [scrollbar-width:none]`}
        slides={slides}
      />
    </div>
  );
}
