'use client';

import React, { useState } from 'react';
import ContentOverlayFrame from '@/components/overlay/ContentOverlayFrame';
import OverlayHeader from '@/components/ui/OverlayHeader';
import OverlaySlider from '@/components/ui/OverlaySlider';
import { canManageContent } from '@/lib/content-permissions';
import { themeColors } from '@/lib/theme-colors';
import PlaceForm from './place/PlaceForm';
import PortalForm from './portal/PortalForm';
import ServiceForm, {
  type InitialServiceData,
} from './service/ServiceForm';
import { invalidateMainScreenDataCaches } from '@/lib/preload/main-screen';
import SpaceForm from '@/components/spaces/SpaceForm';
import { useSession } from 'next-auth/react';
import { useAdminMode } from '@/components/admin/AdminModeProvider';
import { requestJson } from '@/lib/api-client';
import {
  createSpaceRequest,
  deleteSpaceRequest,
  invalidateSpacesCache,
  transferSpaceRequest,
  updateSpaceRequest,
} from '@/lib/spaces/client';

import type { InitialPlaceData, PlaceFormPayload } from './place/PlaceForm';
import type { InitialPortalData, PortalFormPayload } from './portal/PortalForm';
import type { Space, SpaceInput } from '@/lib/spaces/types';
import {
  createServiceRequest,
  deleteServiceRequest,
  updateServiceRequest,
} from '@/lib/services/client';
import type { ServiceInput } from '@/lib/services/types';
import {
  getMapEntryDeleteEndpoint,
  getMapEntrySaveEndpoint,
} from './form-endpoints';

type FormInitialData = (
  (InitialPlaceData & { type: 'place' })
  | (InitialPortalData & { type: 'portal' })
  | InitialServiceData
  | (Space & { type: 'space' })
);

export type FormCategory = 'portal' | 'place' | 'service' | 'space';

export interface OpenFormOverlayOptions {
  initialCategory?: FormCategory;
  initialData?: FormInitialData;
  mode: 'add' | 'edit';
  onSpaceSaved?: (space: Space) => void;
}

interface FormOverlayProps extends OpenFormOverlayOptions {
  onClose: () => void;
  onSaved?: (
    entityType: 'place' | 'portal',
    payload: PlaceFormPayload | PortalFormPayload,
  ) => void | Promise<void>;
  onSpaceDeleted?: (space: Space) => void;
}

const categoryTabs = [
  { value: 'place', label: 'Lieu' },
  { value: 'portal', label: 'Portail' },
  { value: 'space', label: 'Espace' },
  { value: 'service', label: 'Service' },
] as const;

export default function FormOverlay({
  initialCategory,
  initialData,
  mode,
  onClose,
  onSaved,
  onSpaceDeleted,
  onSpaceSaved,
}: FormOverlayProps) {
  const { data: session } = useSession();
  const { effectiveRole } = useAdminMode();
  const [activeCategory, setActiveCategory] = useState<FormCategory>(
    initialData?.type ?? initialCategory ?? 'place',
  );

  const title = mode === 'add'
    ? 'Ajouter du contenu'
    : {
        place: 'Modifier le lieu',
        portal: 'Modifier le portail',
        service: 'Modifier le service',
        space: 'Modifier l’espace',
      }[activeCategory];
  const editor = mode === 'edit' ? initialData?.lastEditor : undefined;
  const showLastEditor = Boolean(
    editor
    && initialData
    && canManageContent(effectiveRole, session?.user?.id, initialData),
  );

  const handleSubmit = async (entityType: 'place' | 'portal', payload: PlaceFormPayload | PortalFormPayload) => {
    const mapEntryData = initialData?.type === 'place'
      || initialData?.type === 'portal'
      ? initialData
      : undefined;
    const url = getMapEntrySaveEndpoint(entityType, mode, mapEntryData);
    const method = mode === 'add' ? 'POST' : 'PUT';
    const entityLabel = entityType === 'place' ? 'lieu' : 'portail';

    await requestJson(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }, `Impossible de ${mode === 'add' ? 'créer' : 'modifier'} le ${entityLabel}.`);

    invalidateSpacesCache();
    invalidateMainScreenDataCaches();
    await onSaved?.(entityType, payload);
    onClose();
  };

  const handlePlaceSubmit = async (payload: PlaceFormPayload) => {
    await handleSubmit('place', payload);
  };

  const handlePortalSubmit = async (payload: PortalFormPayload) => {
    await handleSubmit('portal', payload);
  };

  const handleDelete = async () => {
    if (
      !initialData
      || initialData.type === 'service'
      || initialData.type === 'space'
    ) {
      throw new Error('Contenu à supprimer introuvable.');
    }
    const entityLabel = initialData.type === 'place' ? 'lieu' : 'portail';
    await requestJson(getMapEntryDeleteEndpoint(initialData), {
      method: 'DELETE',
    }, `Impossible de supprimer le ${entityLabel}.`);
    invalidateSpacesCache();
    invalidateMainScreenDataCaches();
    onClose();
  };

  const handleSpaceSubmit = async (input: SpaceInput) => {
    const saved = mode === 'edit' && initialData?.type === 'space'
      ? await updateSpaceRequest(initialData.slug, input)
      : await createSpaceRequest(input);
    onSpaceSaved?.(saved);
    onClose();
  };

  const handleSpaceDelete = async () => {
    if (initialData?.type !== 'space') {
      throw new Error('Espace à supprimer introuvable.');
    }
    await deleteSpaceRequest(initialData.slug);
    onSpaceDeleted?.(initialData);
    onClose();
  };

  const handleServiceSubmit = async (input: ServiceInput) => {
    if (mode === 'edit' && initialData?.type === 'service') {
      await updateServiceRequest(initialData.slug, input);
    } else {
      await createServiceRequest(input);
    }
    onClose();
  };

  const handleServiceDelete = async () => {
    if (initialData?.type !== 'service') {
      throw new Error('Service à supprimer introuvable.');
    }
    await deleteServiceRequest(initialData.slug);
    onClose();
  };

  const handleSpaceTransfer = async (
    userId: string,
    confirmation: string,
  ) => {
    if (initialData?.type !== 'space') {
      throw new Error('Espace à transférer introuvable.');
    }
    const saved = await transferSpaceRequest(
      initialData.slug,
      userId,
      confirmation,
    );
    onSpaceSaved?.(saved);
    onClose();
  };

  const slides = [
    {
      value: 'place' as const,
      className: 'pt-16',
      content: (
        <PlaceForm
          mode={mode}
          initialData={initialData?.type === 'place' ? initialData : undefined}
          onSubmit={handlePlaceSubmit}
          onCancel={onClose}
          onDelete={initialData?.type === 'place' && initialData.canDelete
            ? handleDelete
            : undefined}
        />
      ),
    },
    {
      value: 'portal' as const,
      className: 'pt-16',
      content: (
        <PortalForm
          mode={mode}
          initialData={initialData?.type === 'portal' ? initialData : undefined}
          onSubmit={handlePortalSubmit}
          onCancel={onClose}
          onDelete={initialData?.type === 'portal' && initialData.canDelete
            ? handleDelete
            : undefined}
        />
      ),
    },
    ...(mode === 'add' || initialData?.type === 'space' ? [{
      value: 'space' as const,
      className: 'pt-16',
      content: session?.user ? (
        <SpaceForm
          effectiveRole={effectiveRole}
          mode={mode}
          onCancel={onClose}
          onDelete={initialData?.type === 'space'
            ? handleSpaceDelete
            : undefined}
          onSubmit={handleSpaceSubmit}
          onTransfer={initialData?.type === 'space'
            ? handleSpaceTransfer
            : undefined}
          space={initialData?.type === 'space'
            ? initialData
            : undefined}
          user={session.user}
        />
      ) : (
        <p className={`text-sm ${themeColors.text.tertiary}`}>
          Chargement du compte...
        </p>
      ),
    }] : []),
    ...(mode === 'add' || initialData?.type === 'service' ? [{
      value: 'service' as const,
      className: 'pt-16',
      content: (
        <ServiceForm
          initialData={initialData?.type === 'service'
            ? initialData
            : undefined}
          mode={mode}
          onCancel={onClose}
          onDelete={initialData?.type === 'service' && initialData.canDelete
            ? handleServiceDelete
            : undefined}
          onSubmit={handleServiceSubmit}
        />
      ),
    }] : []),
  ];

  return (
    <ContentOverlayFrame
      ariaLabel={title}
      editor={editor}
      header={(
        <OverlayHeader
          title={title}
          subtitle={mode === 'add'
            ? 'Sélectionnez la catégorie puis complétez le formulaire correspondant.'
            : undefined}
          onClose={onClose}
        />
      )}
      shadowClass={themeColors.shadow.overlay.place}
      showLastEditor={showLastEditor}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-b-xl">
        <OverlaySlider
          activeValue={activeCategory}
          onChange={setActiveCategory}
          tabs={mode === 'add' ? categoryTabs : []}
          slides={slides}
        />
      </div>
    </ContentOverlayFrame>
  );
}
