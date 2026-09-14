'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import CheckIcon from '@/components/icons/CheckIcon';
import CopyIcon from '@/components/icons/CopyIcon';

interface CopyButtonProps {
  children?: ReactNode;
  className?: string;
  copiedLabel: string;
  copyLabel: string;
  iconClassName?: string;
  revealIconOnHover?: boolean;
  value: string | (() => string);
}

export default function CopyButton({
  children,
  className = '',
  copiedLabel,
  copyLabel,
  iconClassName = 'h-4 w-4',
  revealIconOnHover = false,
  value,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
  }, []);

  const copy = async () => {
    try {
      await copyText(typeof value === 'function' ? value() : value);
      setCopied(true);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = window.setTimeout(() => {
        resetTimeoutRef.current = null;
        setCopied(false);
      }, 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      aria-label={copied ? copiedLabel : copyLabel}
      className={`group/copy ${className}`}
      data-copied={copied}
      onClick={() => void copy()}
      title={copied ? copiedLabel : copyLabel}
      type="button"
    >
      {children}
      <span className={`relative block shrink-0 ${iconClassName}`}>
        <CopyIcon
          className={`absolute inset-0 ${iconClassName} transition-opacity duration-300 ease-out ${
            copied
              ? 'opacity-0'
              : revealIconOnHover ? 'opacity-0 group-hover/copy:opacity-100 group-focus-visible/copy:opacity-100' : 'opacity-100'
          }`}
        />
        <CheckIcon
          aria-hidden="true"
          className={`absolute inset-0 ${iconClassName} transition-opacity duration-300 ease-out ${
            copied ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </span>
    </button>
  );
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
