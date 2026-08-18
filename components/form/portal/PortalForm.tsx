'use client';

import React, { useState } from 'react';
import { themeColors } from '@/lib/theme-colors';
import { createPortalSnapshot } from '../common/form-change-detection';
import {
  parseCoordinateTriplet,
  type CoordinatesInput,
} from '../common/form-utils';
import { useEntityForm } from '../common/useEntityForm';
import { useFormSubmission } from '../common/useFormSubmission';
import FormActions from '../common/FormActions';
import CommonFields from '../common/CommonFields';
import ContentColorField, { ContentPresentationSection } from '../common/ContentColorField';
import FormSection from '../common/FormSection';
import SpaceAssociationField from '../association/SpaceAssociationField';
import { useNetherAddress } from '../nether/NetherAddressField';
import {
  useNetherCoordinates,
} from '../nether/NetherCoordinatesField';
import MapEntryManagementFields from '../management/MapEntryManagementFields';
import {
  emptyMapEntryDraft,
  getMapEntryDraftSnapshot,
  toMapEntryCreationPayload,
  toMapEntryUpdatePayload,
  type MapEntryCreationPayload,
  type MapEntryEditor,
  type MapEntryUpdatePayload,
} from '@/lib/map-entry/types';
import type { SpaceReference } from '@/lib/spaces/types';
import { DEFAULT_CONTENT_COLOR } from '@/lib/content/colors';
import PortalLocationFields from './PortalLocationFields';

const blankCoords = { x: '', y: '', z: '' };

export interface InitialPortalData {
  type: 'portal';
  color: string;
  variant: 'overworld' | 'nether' | 'linked';
  name: string;
  id: string;
  canDelete?: boolean;
  lastEditor?: MapEntryEditor;
  managerIds: string[];
  mapEntryId?: string;
  primaryManagerId: string;
  space?: SpaceReference | null;
  coordinates?: { x: number; y: number; z: number }; // For single portals
  address?: string; // For single nether portals
  overworldCoordinates?: { x: number; y: number; z: number }; // For linked portals
  netherCoordinates?: { x: number; y: number; z: number }; // For linked portals
  description?: string;
  netherAddress?: string; // For linked nether portals
}

type SinglePortalPayload = {
  color: string;
  mode: 'single';
  management?: MapEntryCreationPayload | MapEntryUpdatePayload;
  spaceId: string | null;
  portal: {
    slug: string;
    name: string;
    world: 'overworld' | 'nether';
    coordinates: { x: number; y: number; z: number };
    description?: string;
    address?: string;
  };
}

type LinkedPortalPayload = {
  color: string;
  mode: 'linked';
  management?: MapEntryCreationPayload | MapEntryUpdatePayload;
  spaceId: string | null;
  slug: string;
  name: string;
  description?: string;
  overworld: {
    coordinates: { x: number; y: number; z: number };
    description?: string;
  };
  nether: {
    coordinates: { x: number; y: number; z: number };
    description?: string;
    address?: string;
  };
}

export type PortalFormPayload = SinglePortalPayload | LinkedPortalPayload;

interface PortalFormProps {
  mode?: 'add' | 'edit';
  initialData?: InitialPortalData;
  onSubmit: (payload: PortalFormPayload) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

export default function PortalForm({
  mode = 'add',
  initialData,
  onSubmit,
  onCancel,
  onDelete,
}: PortalFormProps) {
  const fields = useEntityForm(
    initialData?.name,
    initialData?.id,
    initialData?.description,
  );
  const [color, setColor] = useState(initialData?.color ?? DEFAULT_CONTENT_COLOR);
  const [portalVariant, setPortalVariant] = useState(initialData?.variant || 'overworld');
  const [singleCoords, setSingleCoords] = useState<CoordinatesInput>(initialData?.coordinates ? { x: String(initialData.coordinates.x), y: String(initialData.coordinates.y), z: String(initialData.coordinates.z) } : blankCoords);

  const [overworldCoords, setOverworldCoords] = useState<CoordinatesInput>(initialData?.overworldCoordinates ? { x: String(initialData.overworldCoordinates.x), y: String(initialData.overworldCoordinates.y), z: String(initialData.overworldCoordinates.z) } : blankCoords);
  const netherCoordinates = useNetherCoordinates({
    initialValue: initialData?.netherCoordinates,
    overworldCoordinates: overworldCoords,
  });
  const netherCoords = netherCoordinates.value;

  const [managementDraft, setManagementDraft] = useState(emptyMapEntryDraft);
  const [managementReady, setManagementReady] = useState(mode === 'add');
  const [selectedSpace, setSelectedSpace] = useState<SpaceReference | null>(
    initialData?.space ?? null,
  );

  const isLinkedVariant = portalVariant === 'linked';
  const singleWorld: 'overworld' | 'nether' = portalVariant === 'nether' ? 'nether' : 'overworld';
  const singleAddress = useNetherAddress({
    enabled: portalVariant === 'nether',
    coords: singleCoords,
    initialValue: initialData?.address,
  });
  const netherAddress = useNetherAddress({
    enabled: portalVariant === 'linked',
    coords: netherCoords,
    initialValue: initialData?.netherAddress,
  });
  const snapshot = {
    ...createPortalSnapshot({
      color,
      description: fields.description,
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
    isValid: fields.isValid && hasValidCoordinates,
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
          mode: 'single' as const,
          management: mode === 'add'
            ? toMapEntryCreationPayload(managementDraft)
            : toMapEntryUpdatePayload(managementDraft),
          spaceId: selectedSpace?.id ?? null,
          portal: {
            slug: fields.input.slug,
            name: fields.input.name,
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
          mode: 'linked' as const,
          management: mode === 'add'
            ? toMapEntryCreationPayload(managementDraft)
            : toMapEntryUpdatePayload(managementDraft),
          spaceId: selectedSpace?.id ?? null,
          slug: fields.input.slug,
          name: fields.input.name,
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

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <FormSection title="Informations générales">
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
          namePlaceholder="Portail du marché impérial de Valnyfrost"
          slugPlaceholder="valny-portail-marche-imperial"
        />
      </FormSection>

      <ContentPresentationSection>
        <ContentColorField
          color={color}
          disabled={submission.isSubmitting}
          entityLabel="portail"
          onChange={setColor}
          space={selectedSpace}
        />
      </ContentPresentationSection>

      <FormSection title="Gestion">
        <MapEntryManagementFields
          disabled={submission.isSubmitting}
          mapEntryId={initialData?.mapEntryId}
          mode={mode}
          draft={managementDraft}
          onDraftChange={setManagementDraft}
          onReadyChange={setManagementReady}
        />
      </FormSection>

      <FormSection title="Localisation">
        <div className="space-y-1">
          <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Configuration</label>
          <div className="flex gap-1 flex-wrap">
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
      />
    </form>
  );
}
