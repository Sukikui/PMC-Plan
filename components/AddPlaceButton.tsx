
'use client';

import { useSession, signIn } from 'next-auth/react';
import { useOverlay } from './overlay/OverlayProvider';
import { themeColors } from '@/lib/theme-colors';

interface AddPlaceButtonProps {
  className?: string;
  children: React.ReactNode;
}

export default function AddPlaceButton({ className, children }: AddPlaceButtonProps) {
  const { data: session, status } = useSession();
  const { openFormOverlay } = useOverlay();

  const handleClick = () => {
    if (status === 'authenticated' && session?.user) {
      openFormOverlay('add');
    } else {
      signIn('discord');
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={status === 'loading'}
      className={className}
    >
      {children}
    </button>
  );
}
