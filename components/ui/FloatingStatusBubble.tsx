import { useEffect, useState, type HTMLAttributes, type ReactNode } from 'react';
import { themeColors } from '@/lib/theme-colors';

interface FloatingStatusBubbleProps extends HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  children: ReactNode;
  highlightOnHover?: boolean;
  shape?: 'pill' | 'rounded';
}

export const floatingStatusBubbleCompactClassName = 'h-9 items-center text-xs font-medium';
const floatingStatusBubbleFadeDurationMs = 220;

export function FloatingStatusBubblePresence({
  children,
  className = '',
  visible,
  ...props
}: HTMLAttributes<HTMLDivElement> & { visible: boolean }) {
  return (
    <div
      {...props}
      aria-hidden={!visible}
      className={`transition-[opacity,filter] ease-out ${visible ? 'opacity-100 blur-0' : 'opacity-0 blur-[3px]'} ${className}`}
      style={{
        ...props.style,
        transitionDuration: `${floatingStatusBubbleFadeDurationMs}ms`,
      }}
    >
      {children}
    </div>
  );
}

export function useFloatingStatusBubblePresence<Value>(value: Value | null) {
  const [retainedValue, setRetainedValue] = useState(value);

  useEffect(() => {
    if (value !== null) {
      setRetainedValue(value);
      return;
    }

    const timer = setTimeout(
      () => setRetainedValue(null),
      floatingStatusBubbleFadeDurationMs,
    );
    return () => clearTimeout(timer);
  }, [value]);

  return {
    displayedValue: value ?? retainedValue,
    visible: value !== null,
  };
}

export function getFloatingStatusBubbleClassName({
  active = false,
  className = '',
  highlightOnHover = true,
  shape = 'pill',
}: Pick<
  FloatingStatusBubbleProps,
  'active' | 'className' | 'highlightOnHover' | 'shape'
> = {}) {
  return `border ${
    active ? themeColors.panel.primary : themeColors.panel.secondary
  } ${themeColors.border.light} ${
    highlightOnHover ? themeColors.interactive.hoverBorder : ''
  } ${themeColors.blurSm} ${themeColors.shadow.button} ${themeColors.transition} ${
    shape === 'pill'
      ? themeColors.util.roundedFull
      : themeColors.util.roundedLg
  } ${className}`;
}

export default function FloatingStatusBubble({
  active = false,
  children,
  className = '',
  highlightOnHover = true,
  shape = 'pill',
  ...props
}: FloatingStatusBubbleProps) {
  return (
    <div
      {...props}
      className={getFloatingStatusBubbleClassName({
        active,
        className,
        highlightOnHover,
        shape,
      })}
    >
      {children}
    </div>
  );
}
