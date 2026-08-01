"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useOverlayLayer } from '@/components/ui/OverlayStackProvider';
import { OVERLAY_TRANSITION_MS } from '@/lib/ui/overlay';

interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  closing?: boolean;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => (
      !element.hidden
      && !element.closest('[aria-hidden="true"], [inert]')
    ));
}

const Overlay: React.FC<OverlayProps> = ({ isOpen, onClose, children, className = '', closing = false }) => {
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);
  const [hasBeenRevealed, setHasBeenRevealed] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const hasFocusedRef = useRef(false);
  const { revealed, top, zIndex } = useOverlayLayer(
    isOpen || closing,
    closing,
    onClose,
  );
  const entered = visible && revealed;
  const interactive = entered && top;

  useEffect(() => {
    if (revealed) setHasBeenRevealed(true);
  }, [revealed]);

  useEffect(() => {
    if (isOpen || closing) {
      setShow(true);
      return;
    }

    setVisible(false);
    const hideTimeoutId = setTimeout(
      () => setShow(false),
      OVERLAY_TRANSITION_MS,
    );
    return () => clearTimeout(hideTimeoutId);
  }, [isOpen, closing]);

  useEffect(() => {
    if (!show) return;

    if (!isOpen || closing) {
      setVisible(false);
      return;
    }

    setVisible(false);
    let enterFrameId: number | null = null;
    const mountFrameId = requestAnimationFrame(() => {
      enterFrameId = requestAnimationFrame(() => setVisible(true));
    });

    return () => {
      cancelAnimationFrame(mountFrameId);
      if (enterFrameId) cancelAnimationFrame(enterFrameId);
    };
  }, [show, isOpen, closing]);

  useEffect(() => {
    if (!show || restoreFocusRef.current) return;
    const activeElement = document.activeElement;
    restoreFocusRef.current = activeElement instanceof HTMLElement
      ? activeElement
      : null;
  }, [show]);

  useEffect(() => {
    if (!interactive || !contentRef.current) return;
    const container = contentRef.current;

    if (!hasFocusedRef.current) {
      const dialog = container.querySelector<HTMLElement>('[role="dialog"]');
      const focusTarget = getFocusableElements(container)[0] ?? dialog ?? container;
      focusTarget.focus({ preventScroll: true });
      hasFocusedRef.current = true;
    }

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && (activeElement === firstElement || !container.contains(activeElement))) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', trapFocus, true);
    return () => document.removeEventListener('keydown', trapFocus, true);
  }, [interactive]);

  useEffect(() => {
    if (show) return;
    hasFocusedRef.current = false;
    const restoreTarget = restoreFocusRef.current;
    restoreFocusRef.current = null;
    if (restoreTarget?.isConnected) restoreTarget.focus({ preventScroll: true });
  }, [show]);

  useEffect(() => () => {
    const restoreTarget = restoreFocusRef.current;
    if (restoreTarget?.isConnected) restoreTarget.focus({ preventScroll: true });
  }, []);

  if (!show) return null;
  return (
    <div
      className={`pointer-events-none fixed inset-0 flex items-center justify-center p-4 ${className}`}
      style={{ zIndex }}
      aria-hidden={!top}
      inert={!top}
    >
      <div
        ref={contentRef}
        tabIndex={-1}
        className="flex w-full items-center justify-center transition-transform duration-300 ease-out"
        style={{
          transform: entered
            ? 'translateY(0)'
            : 'translateY(100vh)',
        }}
      >
        {(hasBeenRevealed || revealed) ? children : null}
      </div>
    </div>
  );
};

export default Overlay;
