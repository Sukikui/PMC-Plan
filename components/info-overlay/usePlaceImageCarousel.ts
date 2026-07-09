'use client';

import { useEffect, useRef, useState } from 'react';
import type React from 'react';

export function usePlaceImageCarousel(itemId: string | undefined, imageCount: number) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
    carouselRef.current?.scrollTo({ left: 0 });
  }, [itemId]);

  const handleScroll = () => {
    const carousel = carouselRef.current;
    if (!carousel || carousel.clientWidth === 0) return;

    const nextIndex = Math.round(carousel.scrollLeft / carousel.clientWidth);
    setActiveIndex((currentIndex) => currentIndex === nextIndex ? currentIndex : nextIndex);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;

    const carousel = carouselRef.current;
    if (!carousel) return;

    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: carousel.scrollLeft,
    };
    carousel.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const carousel = carouselRef.current;
    const dragState = dragStateRef.current;
    if (!carousel || !dragState.active) return;

    event.preventDefault();
    carousel.scrollLeft = dragState.scrollLeft - (event.clientX - dragState.startX);
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const carousel = carouselRef.current;
    dragStateRef.current.active = false;

    if (carousel?.hasPointerCapture(event.pointerId)) {
      carousel.releasePointerCapture(event.pointerId);
    }
  };

  const scrollByDirection = (direction: -1 | 1) => {
    const carousel = carouselRef.current;
    if (!carousel || imageCount === 0) return;

    const nextIndex = (activeIndex + direction + imageCount) % imageCount;
    carousel.scrollTo({
      left: nextIndex * carousel.clientWidth,
      behavior: 'smooth',
    });
    setActiveIndex(nextIndex);
  };

  const scrollToIndex = (index: number) => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.scrollTo({
      left: index * carousel.clientWidth,
      behavior: 'smooth',
    });
    setActiveIndex(index);
  };

  return {
    activeIndex,
    carouselRef,
    handlePointerDown,
    handlePointerEnd,
    handlePointerMove,
    handleScroll,
    scrollByDirection,
    scrollToIndex,
  };
}

