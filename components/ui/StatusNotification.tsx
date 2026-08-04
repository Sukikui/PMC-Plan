'use client';

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEventHandler,
} from 'react';
import FloatingStatusBubble from '@/components/ui/FloatingStatusBubble';
import { themeColors } from '@/lib/theme-colors';

interface StatusNotificationProps {
  className?: string;
  description: string;
  dismissAfterMs?: number;
  onClose?: () => void;
  onClick?: MouseEventHandler<HTMLDivElement>;
  title: string;
  tone?: 'error' | 'info';
}

export default function StatusNotification({
  className = '',
  description,
  dismissAfterMs,
  onClose,
  onClick,
  title,
  tone = 'info',
}: StatusNotificationProps) {
  const [fading, setFading] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const colors = themeColors.statusNotification[tone];
  const interactive = Boolean(onClick);
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    event.currentTarget.click();
  };

  useEffect(() => {
    setFading(false);
    if (dismissAfterMs === undefined) return;

    const fadeTimeout = window.setTimeout(() => setFading(true), dismissAfterMs);
    const closeTimeout = window.setTimeout(
      () => onCloseRef.current?.(),
      dismissAfterMs + 300,
    );
    return () => {
      window.clearTimeout(fadeTimeout);
      window.clearTimeout(closeTimeout);
    };
  }, [dismissAfterMs, title]);

  return (
    <FloatingStatusBubble
      highlightOnHover={false}
      shape="rounded"
      className={`pointer-events-auto w-full p-3 transition-opacity duration-300 ${
        fading ? 'opacity-0' : 'opacity-100'
      } ${interactive ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`h-2 w-2 shrink-0 ${colors.dot} ${themeColors.util.roundedFull} ${themeColors.util.animatePulse}`}
        />
        <p className={`text-xs font-medium ${colors.title}`}>{title}</p>
      </div>
      <p className={`mt-1 text-xs ${colors.description}`}>{description}</p>
    </FloatingStatusBubble>
  );
}
