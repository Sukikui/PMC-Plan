'use client';

import React, { useState } from 'react';
import { themeColors } from '@/lib/theme-colors';
import { createPortalSnapshot } from '../common/form-change-detection';
import {
  parseCoordinateTriplet,
} from '../common/form-utils';
import { useEntityForm } from '../common/useEntityForm';
import { useFormSubmission } from '../common/useFormSubmission';
import FormActions from '../common/FormActions';
import CommonFields from '../common/CommonFields';
import ContentColorField, { ContentPresentationSection } from '../common/ContentColorField';
import ContentImagesField from '../common/ContentImagesField';
import { useContentImages } from '../common/useContentImages';
import FormSection from '../common/FormSection';
import SpaceAssociationField from '../association/SpaceAssociationField';
import MapEntryManagementFields from '../management/MapEntryManagementFields';
import {
  emptyMapEntryDraft,
  getMapEntryDraftSnapshot,
  toMapEntryCreationPayload,
  toMapEntryUpdatePayload,
} from '@/lib/map-entry/types';
import type { SpaceReference } from '@/lib/spaces/types';
import { DEFAULT_CONTENT_COLOR } from '@/lib/content/colors';
import {
  generateUnidentifiedPortalSlug,
  UNIDENTIFIED_PORTAL_LABEL,
} from '@/lib/portal/identity';
import PortalLocationFields from './PortalLocationFields';
import PortalIdentificationField from './PortalIdentificationField';
import type {
  InitialPortalData,
  PortalFormPayload,
} from './portal-form-types';
import type { InitialMapPosition } from '../common/form-values';
import { usePortalLocationState } from './usePortalLocationState';

export type { InitialPortalData, PortalFormPayload } from './portal-form-types';

interface PortalFormProps {
  initialPosition?: InitialMapPosition;
  managementMode?: 'add' | 'edit';
  mode?: 'add' | 'edit';
  initialData?: InitialPortalData;
  onSubmit: (payload: PortalFormPayload) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

export default function PortalForm({
  managementMode: requestedManagementMode,
  mode = 'add',
  initialData,
  initialPosition,
  onSubmit,
  onCancel,
  onDelete,
}: PortalFormProps) {
  const fields = useEntityForm(
    initialData?.unidentified ? '' : initialData?.name,
    initialData?.id,
    initialData?.description,
  );
  const [unidentified, setUnidentified] = useState(
    initialData?.unidentified ?? false,
  );
  const [unidentifiedSlug] = useState(() => (
    initialData?.unidentified ? initialData.id : generateUnidentifiedPortalSlug()
  ));
  const [color, setColor] = useState(initialData?.color ?? DEFAULT_CONTENT_COLOR);
  const contentImages = useContentImages(initialData?.images);
  const {
    netherAddress,
    netherCoordinates,
    overworldCoords,
    portalVariant,
    setOverworldCoords,
    setPortalVariant,
    setSingleCoords,
    singleAddress,
    singleCoords,
  } = usePortalLocationState(initialData, initialPosition);
  const netherCoords = netherCoordinates.value;

  const managementMode = requestedManagementMode ?? mode;
  const [managementDraft, setManagementDraft] = useState(emptyMapEntryDraft);
  const [managementReady, setManagementReady] = useState(managementMode === 'add');
  const [selectedSpace, setSelectedSpace] = useState<SpaceReference | null>(
    initialData?.space ?? null,
  );

  const isLinkedVariant = portalVariant === 'linked';
  const singleWorld: 'overworld' | 'nether' = portalVariant === 'nether' ? 'nether' : 'overworld';
  const snapshot = {
    ...createPortalSnapshot({
      color,
      description: fields.description,
      images: contentImages.images,
      linkedCoordinates: {
        nether: netherCoords,
        overworld: overworldCoords,
      },
      name: fields.name,
      netherAddress: netherAddress.value,
      singleAddress: singleAddress.value,
      singleCoordinates: singleCoords,
      slugSource: fields.input.slug,
      spaceId: selectedSpace?.id ?? null,
      variant: portalVariant,
      unidentified,
      unidentifiedSlug,
    }),
    management: getMapEntryDraftSnapshot(managementDraft),
  };
  const parsedSingleCoords = parseCoordinateTriplet(singleCoords);
  const parsedOverworldCoords = parseCoordinateTriplet(overworldCoords);
  const parsedNetherCoords = parseCoordinateTriplet(netherCoords);
  const hasValidCoordinates = isLinkedVariant
    ? parsedOverworldCoords !== null && parsedNetherCoords !== null
    : parsedSingleCoords !== null;
  const submission = useFormSubmission({
    isReady: managementReady,
    isValid: (managementMode !== 'add' || mode !== 'edit' || !unidentified)
      && (unidentified || fields.isValid)
      && hasValidCoordinates
      && !contentImages.hasInvalidImage,
    mode,
    snapshot,
  });

  const handleSubmit = async (event: React.FormEvent) => {
    await submission.submit(event, async () => {
      if (!isLinkedVariant) {
        if (!parsedSingleCoords) {
          throw new Error('Les coordonnées du portail sont invalides.');
        }
        const payload = {
          color,
          identity: unidentified
            ? { status: 'unidentified' as const, slug: unidentifiedSlug }
            : {
                status: 'identified' as const,
                slug: fields.input.slug,
                name: fields.input.name,
              },
          images: contentImages.values,
          mode: 'single' as const,
          management: managementMode === 'add'
            ? toMapEntryCreationPayload(managementDraft)
            : toMapEntryUpdatePayload(managementDraft),
          spaceId: selectedSpace?.id ?? null,
          portal: {
            world: singleWorld,
            coordinates: parsedSingleCoords,
            description: fields.input.description || undefined,
            address: singleWorld === 'nether' ? (singleAddress.value.trim() || undefined) : undefined,
          },
        };
        await onSubmit(payload);
      } else {
        if (!parsedOverworldCoords || !parsedNetherCoords) {
          throw new Error('Les coordonnées des portails sont invalides.');
        }
        const payload = {
          color,
          identity: unidentified
            ? { status: 'unidentified' as const, slug: unidentifiedSlug }
            : {
                status: 'identified' as const,
                slug: fields.input.slug,
                name: fields.input.name,
              },
          images: contentImages.values,
          mode: 'linked' as const,
          management: managementMode === 'add'
            ? toMapEntryCreationPayload(managementDraft)
            : toMapEntryUpdatePayload(managementDraft),
          spaceId: selectedSpace?.id ?? null,
          overworld: {
            coordinates: parsedOverworldCoords,
            description: fields.input.description || undefined,
          },
          nether: {
            coordinates: parsedNetherCoords,
            description: fields.input.description || undefined,
            address: netherAddress.value.trim() || undefined,
          },
        };
        await onSubmit(payload);
      }
    });
  };

  const handlePortalDelete = async () => {
    if (!onDelete) return;
    await submission.execute(onDelete);
  };

  const handleIdentificationChange = (nextUnidentified: boolean) => {
    setUnidentified(nextUnidentified);
    if (!nextUnidentified) {
      setManagementDraft((current) => ({
        ...current,
        excludedOwnerUuids: [],
      }));
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <FormSection title="Informations générales">
        <div className="mb-4">
          <PortalIdentificationField
            disabled={submission.isSubmitting}
            onChange={handleIdentificationChange}
            unidentified={unidentified}
          />
        </div>
        <CommonFields
          afterSlug={(
            <SpaceAssociationField
              disabled={submission.isSubmitting}
              onChange={setSelectedSpace}
              value={selectedSpace}
            />
          )}
          descriptionPlaceholder="Présentez rapidement ce portail et son accès."
          disabled={submission.isSubmitting}
          form={fields}
          identityPreview={unidentified ? {
            name: UNIDENTIFIED_PORTAL_LABEL,
            slug: unidentifiedSlug,
          } : undefined}
          namePlaceholder="Portail du marché impérial de Valnyfrost"
          slugPlaceholder="valny-portail-marche-imperial"
        />
      </FormSection>

      <ContentPresentationSection>
        {!unidentified && (
          <ContentColorField
            color={color}
            disabled={submission.isSubmitting}
            entityLabel="portail"
            onChange={setColor}
            space={selectedSpace}
          />
        )}
        <ContentImagesField
          controller={contentImages}
          reorderable={mode === 'edit'}
        />
      </ContentPresentationSection>

      <FormSection title="Gestion">
        <MapEntryManagementFields
          disabled={submission.isSubmitting}
          mapEntryId={initialData?.mapEntryId}
          mode={managementMode}
          draft={managementDraft}
          onDraftChange={setManagementDraft}
          onReadyChange={setManagementReady}
          ownersEnabled={!unidentified}
        />
      </FormSection>

      <FormSection title="Localisation">
        <div className="space-y-1">
          <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Configuration</label>
          <div className="flex gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => setPortalVariant('linked')}
              className={`px-3 py-1.5 text-sm ${themeColors.util.roundedFull} font-medium ${themeColors.transition} ${
                portalVariant === 'linked'
                  ? themeColors.world.linked
                  : `${themeColors.button.ghost} ${themeColors.interactive.hover}`
              }`}
            >
              overworld + nether
            </button>
            <button
              type="button"
              onClick={() => setPortalVariant('overworld')}
              className={`px-3 py-1.5 text-sm ${themeColors.util.roundedFull} font-medium ${themeColors.transition} ${
                portalVariant === 'overworld'
                  ? themeColors.world.overworld
                  : `${themeColors.button.ghost} ${themeColors.interactive.hover}`
              }`}
            >
              overworld
            </button>
            <button
              type="button"
              onClick={() => setPortalVariant('nether')}
              className={`px-3 py-1.5 text-sm ${themeColors.util.roundedFull} font-medium ${themeColors.transition} ${
                portalVariant === 'nether'
                  ? themeColors.world.nether
                  : `${themeColors.button.ghost} ${themeColors.interactive.hover}`
              }`}
            >
              nether
            </button>
          </div>
        </div>

        <PortalLocationFields
          netherAddress={netherAddress}
          netherCoordinates={netherCoordinates}
          overworldCoordinates={overworldCoords}
          setOverworldCoordinates={setOverworldCoords}
          setSingleCoordinates={setSingleCoords}
          singleAddress={singleAddress}
          singleCoordinates={singleCoords}
          variant={portalVariant}
        />
      </FormSection>

      <FormActions
        canSubmit={submission.canSubmit}
        error={submission.error}
        onCancel={onCancel}
        isSubmitting={submission.isSubmitting}
        mode={mode}
        onDelete={mode === 'edit' && onDelete ? handlePortalDelete : undefined}
        entityType="portal"
        entitySlug={initialData?.id || ''}
        confirmation={unidentified ? {
          message: 'Pour confirmer la suppression définitive, écris SUPPRIMER.',
          value: 'SUPPRIMER',
        } : undefined}
      />
    </form>
  );
}
