'use client';

import React, { useEffect, useRef, useState } from 'react';
import { themeColors } from '@/lib/theme-colors';
import { slugify, parseCoordinateTriplet, CoordinatesInput, SubHeader } from './form-utils';
import { useEntityForm } from './useEntityForm';
import FormActions from './FormActions';
import CommonFields from './CommonFields';

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
  const [singleAddress, setSingleAddress] = useState(initialData?.address || '');
  const [singleAddressManual, setSingleAddressManual] = useState(!!initialData?.address);
  const [singleAddressLoading, setSingleAddressLoading] = useState(false);
  const [singleAddressError, setSingleAddressError] = useState<string | null>(null);

  const [overworldCoords, setOverworldCoords] = useState<CoordinatesInput>(initialData?.overworldCoordinates ? { x: String(initialData.overworldCoordinates.x), y: String(initialData.overworldCoordinates.y), z: String(initialData.overworldCoordinates.z) } : blankCoords);
  const [netherCoords, setNetherCoords] = useState<CoordinatesInput>(initialData?.netherCoordinates ? { x: String(initialData.netherCoordinates.x), y: String(initialData.netherCoordinates.y), z: String(initialData.netherCoordinates.z) } : blankCoords);
  const [netherAddress, setNetherAddress] = useState(initialData?.netherAddress || '');
  const [netherAddressManual, setNetherAddressManual] = useState(!!initialData?.netherAddress);
  const [netherAddressLoading, setNetherAddressLoading] = useState(false);
  const [netherAddressError, setNetherAddressError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isLinkedVariant = portalVariant === 'linked';
  const singleWorld: 'overworld' | 'nether' = portalVariant === 'nether' ? 'nether' : 'overworld';

  const singleAddressRequestId = useRef(0);
  const linkedAddressRequestId = useRef(0);

  useEffect(() => {
    if (portalVariant === 'linked') {
      setSingleAddressManual(false);
      setSingleAddressError(null);
    } else {
      setNetherAddressManual(false);
      setNetherAddressError(null);
    }
  }, [portalVariant]);

  useEffect(() => {
    if (portalVariant === 'nether') {
      setSingleAddressManual(false);
      setSingleAddressError(null);
    } else {
      setSingleAddress('');
      setSingleAddressManual(false);
      setSingleAddressError(null);
    }
  }, [portalVariant]);

  const requestNetherAddress = async (
    coords: { x: number; y: number; z: number },
    setters: {
      setLoading: (value: boolean) => void;
      setValue: (value: string) => void;
      setError: (value: string | null) => void;
    },
    requestRef: React.MutableRefObject<number>
  ) => {
    try {
      setters.setLoading(true);
      setters.setError(null);
      requestRef.current += 1;
      const currentId = requestRef.current;
      const params = new URLSearchParams({
        x: coords.x.toString(),
        y: coords.y.toString(),
        z: coords.z.toString(),
      });
      const response = await fetch(`/api/nether-address?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Erreur lors du calcul de l\'adresse');
      }
      const data = await response.json();
      if (requestRef.current === currentId) {
        setters.setValue(data.address ?? '');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Adresse indisponible';
      setters.setError(message);
    } finally {
      setters.setLoading(false);
    }
  };

  useEffect(() => {
    if (portalVariant !== 'nether' || singleAddressManual) {
      return;
    }
    const coords = parseCoordinateTriplet(singleCoords);
    if (!coords) {
      return;
    }
    requestNetherAddress(
      coords,
      {
        setLoading: setSingleAddressLoading,
        setValue: setSingleAddress,
        setError: setSingleAddressError,
      },
      singleAddressRequestId
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portalVariant, singleCoords.x, singleCoords.y, singleCoords.z, singleAddressManual]);

  useEffect(() => {
    if (portalVariant !== 'linked' || netherAddressManual) {
      return;
    }
    const coords = parseCoordinateTriplet(netherCoords);
    if (!coords) {
      return;
    }
    requestNetherAddress(
      coords,
      {
        setLoading: setNetherAddressLoading,
        setValue: setNetherAddress,
        setError: setNetherAddressError,
      },
      linkedAddressRequestId
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portalVariant, netherCoords.x, netherCoords.y, netherCoords.z, netherAddressManual]);

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
            address: singleWorld === 'nether' ? (singleAddress.trim() || undefined) : undefined,
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
            address: netherAddress.trim() || undefined,
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

  const recomputeSingleAddress = () => {
    if (portalVariant !== 'nether') {
      return;
    }
    const coords = parseCoordinateTriplet(singleCoords);
    if (!coords) {
      setSingleAddressError('Coordonnées invalides');
      return;
    }
    setSingleAddressManual(false);
    requestNetherAddress(
      coords,
      {
        setLoading: setSingleAddressLoading,
        setValue: setSingleAddress,
        setError: setSingleAddressError,
      },
      singleAddressRequestId
    );
  };

  const recomputeLinkedAddress = () => {
    const coords = parseCoordinateTriplet(netherCoords);
    if (!coords) {
      setNetherAddressError('Coordonnées invalides');
      return;
    }
    setNetherAddressManual(false);
    requestNetherAddress(
      coords,
      {
        setLoading: setNetherAddressLoading,
        setValue: setNetherAddress,
        setError: setNetherAddressError,
      },
      linkedAddressRequestId
    );
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

  const renderNetherAddressField = (
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    manual: boolean,
    setManual: React.Dispatch<React.SetStateAction<boolean>>,
    loading: boolean,
    error: string | null,
    label: string,
    onAutoRecalculate: () => void
  ) => (
    <div className="space-y-2">
      <label className={`text-xs font-medium ${themeColors.text.secondary}`}>{label}</label>
      <input
        className={`${inputClass} ${manual ? '' : 'cursor-not-allowed opacity-70'}`}
        placeholder="Adresse suggérée"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={!manual}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            if (manual) {
              setManual(false);
              onAutoRecalculate();
            }
          }}
          className={`px-3 py-1 text-xs rounded-full font-medium transition-colors duration-300 ${ 
            !manual
              ? 'bg-blue-100/50 dark:bg-blue-800/20 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100/30 dark:bg-gray-700/15 text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-600/20'
          }`}
        >
          Automatique
        </button>
        <button
          type="button"
          onClick={() => setManual(true)}
          className={`px-3 py-1 text-xs rounded-full font-medium transition-colors duration-300 ${ 
            manual
              ? 'bg-blue-100/50 dark:bg-blue-800/20 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100/30 dark:bg-gray-700/15 text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-600/20'
          }`}
        >
          Manuel
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs">
        {loading && <span className={themeColors.text.tertiary}>Calcul de l&#39;adresse…</span>}
        {error && <span className={themeColors.travelPlan.errorIcon}>{error}</span>}
      </div>
    </div>
  );

  const renderSingleForm = (world: 'overworld' | 'nether') => {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {renderCoordinateInputs(singleCoords, setSingleCoords, 'Coordonnées')}
        </div>
        {world === 'nether' && renderNetherAddressField(
          singleAddress,
          setSingleAddress,
          singleAddressManual,
          setSingleAddressManual,
          singleAddressLoading,
          singleAddressError,
          'Adresse sur l\'autoroute du nether',
          recomputeSingleAddress
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
        {renderNetherAddressField(
          netherAddress,
          setNetherAddress,
          netherAddressManual,
          setNetherAddressManual,
          netherAddressLoading,
          netherAddressError,
          'Adresse dans le nether',
          recomputeLinkedAddress
        )}
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
                  ? 'bg-purple-100/50 dark:bg-purple-800/20 text-purple-700 dark:text-purple-300'
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
        <div className={`text-sm ${themeColors.travelPlan.errorIcon}`}>{submitError}</div>
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