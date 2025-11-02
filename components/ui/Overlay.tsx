"use client";

import React, { useEffect, useState } from 'react';
import { themeColors } from '@/lib/theme-colors';

interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  closing?: boolean;
}

const Overlay: React.FC<OverlayProps> = ({ isOpen, onClose, children, className = '', closing = false }) => {
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);

  // Fade logic: mount when opening or closing; visible = isOpen && !closing
  useEffect(() => {
    let rafId: number | null = null;
    let tId: ReturnType<typeof setTimeout> | null = null;
    if (isOpen || closing) {
      setShow(true);
      rafId = requestAnimationFrame(() => setVisible(isOpen && !closing));
    } else {
      setVisible(false);
      tId = setTimeout(() => setShow(false), 300);
    }
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (tId) clearTimeout(tId);
    };
  }, [isOpen, closing]);

  if (!show) return null;
  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${className}`}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      {/* Backdrop with blur + tint, fading symmetrically during open/close */}
      <div
        className={`fixed inset-0 ${themeColors.ui.overlayBackdrop} ${themeColors.blurSm} transition-opacity duration-300`}
        style={{ opacity: visible ? 1 : 0 }}
        onClick={onClose}
        aria-label="Fermer l'overlay"
      />
      <div className="flex w-full justify-center items-center h-full">
        {children}
      </div>
    </div>
  );
};

export default Overlay;
