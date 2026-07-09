'use client';

import React, { useState } from 'react';
import { themeColors } from '@/lib/theme-colors';
import { useOverlayPanelAnimation } from '@/components/ui/useOverlayPanelAnimation';
import IconActionButton from '@/components/ui/IconActionButton';
import CrossIcon from '@/components/icons/CrossIcon';
import PlaceForm from './place/PlaceForm';
import PortalForm from './portal/PortalForm';
import { invalidateMainScreenDataCaches } from '@/lib/preload/main-screen';

import type { InitialPlaceData, PlaceFormPayload } from './place/PlaceForm';
import type { InitialPortalData, PortalFormPayload } from './portal/PortalForm';

interface FormOverlayProps {
  initialData?: (InitialPlaceData & { type: 'place' }) | (InitialPortalData & { type: 'portal' });
  mode?: 'add' | 'edit';
  onClose: () => void;
  onSaved?: (entityType: 'place' | 'portal', payload: PlaceFormPayload | PortalFormPayload) => void;
  closing: boolean;
}

export default function FormOverlay({ initialData, mode = 'add', onClose, onSaved, closing }: FormOverlayProps) {
  const [activeCategory, setActiveCategory] = useState(initialData?.type || 'portal');
  const animIn = useOverlayPanelAnimation(!closing, { closing });

  const title = mode === 'add'
    ? 'Ajouter un lieu ou un portail'
    : activeCategory === 'place'
      ? 'Modifier le lieu'
      : 'Modifier le portail';

  const handleSubmit = async (entityType: 'place' | 'portal', payload: PlaceFormPayload | PortalFormPayload) => {
    const url = mode === 'add' ? `/api/${entityType}s` : `/api/${entityType}s/${initialData!.id}`;
    const method = mode === 'add' ? 'POST' : 'PUT';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Impossible de ${mode === 'add' ? 'créer' : 'modifier'} le ${entityType}.`);
    }

    invalidateMainScreenDataCaches();
    onSaved?.(entityType, payload);
    onClose();
  };

  const handlePlaceSubmit = async (payload: PlaceFormPayload) => {
    await handleSubmit('place', payload);
  };

  const handlePortalSubmit = async (payload: PortalFormPayload) => {
    await handleSubmit('portal', payload);
  };

  return (
    <div className="flex w-full justify-center items-center h-full">
      <div
        className={`relative ${themeColors.panel.primary} ${themeColors.blur} ${themeColors.util.roundedXl} [box-shadow:0_0_25px_0_var(--tw-shadow-color)] ${themeColors.shadow.overlay.place} w-full max-w-3xl min-w-0 h-[min(90vh,calc(100vh-4rem))] border ${themeColors.border.primary} flex flex-col transition-all duration-300 ease-out`}
        style={{
          width: 'min(48rem, calc(100vw - 2rem))',
          transform: animIn ? 'translateY(0)' : 'translateY(100%)',
          opacity: animIn ? 1 : 0,
        }}
      >
        <div className={`flex-shrink-0 p-6 border-b ${themeColors.border.primary} ${themeColors.panel.primary} ${themeColors.transition} rounded-t-xl flex items-start justify-between`}>
          <div>
            <h2 className={`text-2xl font-bold ${themeColors.text.primary} ${themeColors.transition}`}>{title}</h2>
            {mode === 'add' && (
              <p className={`text-sm ${themeColors.text.tertiary}`}>Sélectionnez la catégorie puis complétez le formulaire correspondant.</p>
            )}
          </div>
          <IconActionButton
            type="button"
            onClick={onClose}
            aria-label="Fermer"
          >
            <CrossIcon className={`w-4 h-4 ${themeColors.text.secondary}`} />
          </IconActionButton>
        </div>

        <div className="relative flex-1 min-h-0 overflow-hidden rounded-b-xl">
          <div className={`absolute top-0 left-0 right-0 h-20 gradient-top-solid-blur z-10 pointer-events-none ${themeColors.transition}`} />
          <div className={`absolute bottom-0 left-0 right-0 h-2 ${themeColors.gradient.bottomSolid} z-10 pointer-events-none ${themeColors.transition}`} />
          <div className={`absolute bottom-2 left-0 right-0 h-8 ${themeColors.gradient.bottomBlur} z-10 pointer-events-none ${themeColors.transition}`} />

          {mode === 'add' && (
            <div className="absolute top-0 left-0 right-0 px-6 pt-4 pb-2 z-20 flex gap-2 items-center">
              <button
                type="button"
                aria-pressed={activeCategory === 'portal'}
                onClick={() => setActiveCategory('portal')}
                className={`${themeColors.toggle.base} ${
                  activeCategory === 'portal'
                    ? themeColors.toggle.activeBlue
                    : themeColors.toggle.inactive
                }`}
              >
                Portail
              </button>
              <button
                type="button"
                aria-pressed={activeCategory === 'place'}
                onClick={() => setActiveCategory('place')}
                className={`${themeColors.toggle.base} ${
                  activeCategory === 'place'
                    ? themeColors.toggle.activeBlue
                    : themeColors.toggle.inactive
                }`}
              >
                Lieu
              </button>
            </div>
          )}

          <div className="relative h-full">
            <div
              className="flex h-full transition-transform duration-300 ease-in-out"
              style={{
                width: '200%',
                transform: activeCategory === 'portal' ? 'translateX(0%)' : 'translateX(-50%)',
              }}
            >
              <div
                className={`w-1/2 min-w-0 flex-shrink-0 h-full overflow-y-auto px-6 pt-16 pb-14 ${themeColors.panel.primary} ${themeColors.transition}`}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                aria-hidden={activeCategory !== 'portal'}
              >
                <PortalForm mode={mode} initialData={initialData?.type === 'portal' ? initialData : undefined} onSubmit={handlePortalSubmit} onCancel={onClose} />
              </div>
              <div
                className={`w-1/2 min-w-0 flex-shrink-0 h-full overflow-y-auto px-6 pt-16 pb-14 ${themeColors.panel.primary} ${themeColors.transition}`}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                aria-hidden={activeCategory !== 'place'}
              >
                <PlaceForm mode={mode} initialData={initialData?.type === 'place' ? initialData : undefined} onSubmit={handlePlaceSubmit} onCancel={onClose} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
