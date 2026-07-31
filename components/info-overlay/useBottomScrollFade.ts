'use client';

import { useEffect, useRef, useState } from 'react';

export function useBottomScrollFade(refreshKey: unknown) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showBottomBlur, setShowBottomBlur] = useState(false);

  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = contentElement;
      setShowBottomBlur(scrollTop + clientHeight < scrollHeight - 10);
    };

    update();
    contentElement.addEventListener('scroll', update);
    return () => contentElement.removeEventListener('scroll', update);
  }, [refreshKey]);

  return { contentRef, showBottomBlur };
}
