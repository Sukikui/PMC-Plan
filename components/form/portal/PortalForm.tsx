'use client';

import React, { useState } from 'react';
import { themeColors } from '@/lib/theme-colors';
import { slugify, parseCoordinateTriplet, CoordinatesInput, SubHeader } from '../common/form-utils';
import { useEntityForm } from '../common/useEntityForm';
import FormActions from '../common/FormActions';
import CommonFields from '../common/CommonFields';
import { NetherAddressField, useNetherAddress } from '../nether/NetherAddressField';

const inputClass = `${themeColors.input.search} border ${themeColors.util.roundedLg} px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder}`;

const blankCoords = { x: '', y: '', z: '' };

export interface InitialPortalData {
  type: 'portal';
  variant: 'overworld' | 'nether' | 'linked';
  name: string;
  id: string;
  owners?: string[];
  coordinates?: { x: number; y: number; z: number }; // For single portals
  address?: string; // For single nether portals
  overworldCoordinates?: { x: number; y: number; z: number }; // For linked portals
  netherCoordinates?: { x: number; y: number; z: number }; // For linked portals
  description?: string;
  netherAddress?: string; // For linked nether portals
}

type SinglePortalPayload = {
  mode: 'single';
  portal: {
    slug: string;
    name: string;
    world: 'overworld' | 'nether';
    coordinates: { x: number; y: number; z: number };
    description?: string;
    address?: string;
    ownerNames: string[];
  };
}

type LinkedPortalPayload = {
  mode: 'linked';
  slug: string;
  name: string;
  owners: string[];
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
}

export default function PortalForm({ mode = 'add', initialData, onSubmit, onCancel }: PortalFormProps) {
  const { name, setName, slug, setSlug, slugManuallyEdited, setSlugManuallyEdited, ownersInput, setOwnersInput, ownersList, description, setDescription } = useEntityForm(initialData?.name, initialData?.id, initialData?.owners, initialData?.description);
  const [portalVariant, setPortalVariant] = useState(initialData?.variant || 'overworld');
  const [singleCoords, setSingleCoords] = useState<CoordinatesInput>(initialData?.coordinates ? { x: String(initialData.coordinates.x), y: String(initialData.coordinates.y), z: String(initialData.coordinates.z) } : blankCoords);

  const [overworldCoords, setOverworldCoords] = useState<CoordinatesInput>(initialData?.overworldCoordinates ? { x: String(initialData.overworldCoordinates.x), y: String(initialData.overworldCoordinates.y), z: String(initialData.overworldCoordinates.z) } : blankCoords);
  const [netherCoords, setNetherCoords] = useState<CoordinatesInput>(initialData?.netherCoordinates ? { x: String(initialData.netherCoordinates.x), y: String(initialData.netherCoordinates.y), z: String(initialData.netherCoordinates.z) } : blankCoords);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitError(null);

    const baseSlug = slugify(slugManuallyEdited ? slug : name);
    if (!baseSlug) {
      setSubmitError('Veuillez renseigner un identifiant valide.');
      return;
    }
    if (!name.trim()) {
      setSubmitError('Le nom est requis.');
      return;
    }

    try {
      setSubmitting(true);
      if (!isLinkedVariant) {
        const coords = parseCoordinateTriplet(singleCoords);
        if (!coords) {
          throw new Error('Les coordonnées du portail sont invalides.');
        }
        const payload = {
          mode: 'single' as const,
          portal: {
            slug: baseSlug,
            name: name.trim(),
            world: singleWorld,
            coordinates: coords,
            description: description.trim() || undefined,
            address: singleWorld === 'nether' ? (singleAddress.value.trim() || undefined) : undefined,
            ownerNames: ownersList,
          },
        };
        await onSubmit(payload);
      } else {
        const overworld = parseCoordinateTriplet(overworldCoords);
        const nether = parseCoordinateTriplet(netherCoords);
        if (!overworld || !nether) {
          throw new Error('Les coordonnées des portails sont invalides.');
        }
        const payload = {
          mode: 'linked' as const,
          slug: baseSlug,
          name: name.trim(),
          owners: ownersList,
          overworld: {
            coordinates: overworld,
            description: description.trim() || undefined,
          },
          nether: {
            coordinates: nether,
            description: description.trim() || undefined,
            address: netherAddress.value.trim() || undefined,
          },
        };
        await onSubmit(payload);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inattendue.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePortalDelete = async () => {
    if (!initialData?.id) return;

    setSubmitting(true);
    try {
      let url = `/api/portals/${initialData.id}`;
      if (initialData.variant !== 'linked') {
        url += `?world=${initialData.variant}`;
      }

      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression du portail.');
      }

      onCancel(); // Close the form after successful deletion
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const renderCoordinateInputs = (
    coords: CoordinatesInput,
    setCoords: React.Dispatch<React.SetStateAction<CoordinatesInput>>,
    label?: string
  ) => (
    <div className="space-y-1">
      {label && <label className={`text-xs font-medium ${themeColors.text.secondary}`}>{label}</label>}
      <div className="grid grid-cols-3 gap-2">
        {(['x', 'y', 'z'] as Array<keyof CoordinatesInput>).map((axis) => (
          <input
            key={axis}
            type="number"
            inputMode="numeric"
            className={inputClass}
            placeholder={axis.toUpperCase()}
            value={coords[axis]}
            onChange={(event) => setCoords((prev) => ({ ...prev, [axis]: event.target.value }))}
          />
        ))}
      </div>
    </div>
  );

  const renderSingleForm = (world: 'overworld' | 'nether') => {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {renderCoordinateInputs(singleCoords, setSingleCoords, 'Coordonnées')}
        </div>
        {world === 'nether' && (
          <NetherAddressField
            address={singleAddress}
            label="Adresse sur l'autoroute du nether"
          />
        )}
      </div>
    );
  };

  const renderLinkedForm = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <SubHeader title="Portail overworld" />
        {renderCoordinateInputs(overworldCoords, setOverworldCoords, 'Coordonnées')}
      </div>
      <div className="space-y-3">
        <SubHeader title="Portail nether" />
        <div className="flex flex-col gap-2">
          {renderCoordinateInputs(netherCoords, setNetherCoords, 'Coordonnées')}
        </div>
        <NetherAddressField
          address={netherAddress}
          label="Adresse dans le nether"
        />
      </div>
    </div>
  );

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <CommonFields
        name={name}
        setName={setName}
        slug={slug}
        setSlug={setSlug}
        slugManuallyEdited={slugManuallyEdited}
        setSlugManuallyEdited={setSlugManuallyEdited}
        ownersInput={ownersInput}
        setOwnersInput={setOwnersInput}
        description={description}
        setDescription={setDescription}
        namePlaceholder="Portail du marché impérial de Valnyfrost"
        slugPlaceholder="valny-portail-marche-imperial"
      />

      <div className="space-y-6">
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
                  ? themeColors.toggle.activePurple
                  : `${themeColors.button.ghost} ${themeColors.interactive.hover}`
              }`}
            >
              overworld + nether
            </button>
          </div>
        </div>

        {isLinkedVariant ? renderLinkedForm() : renderSingleForm(singleWorld)}
      </div>

      {submitError && (
        <div className={`text-sm ${themeColors.feedback.errorText}`}>{submitError}</div>
      )}

      <FormActions
        onCancel={onCancel}
        isSubmitting={submitting}
        submitText={mode === 'add' ? 'Créer le portail' : 'Modifier le portail'}
        submittingText={mode === 'add' ? 'Création…' : 'Modification…'}
        onDelete={mode === 'edit' ? handlePortalDelete : undefined}
        entityType="portal"
        entitySlug={initialData?.id || ''}
      />
    </form>
  );
}
