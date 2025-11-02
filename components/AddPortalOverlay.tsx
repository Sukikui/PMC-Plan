"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { themeColors } from '@/lib/theme-colors';
import { useOverlayPanelAnimation } from '@/components/ui/useOverlayPanelAnimation';
import { Prisma } from '@prisma/client';

interface CoordinatesState {
  x: string;
  y: string;
  z: string;
}

type World = 'overworld' | 'nether';
interface AddPortalOverlayProps {
  onClose: () => void;
  closing?: boolean;
}

interface CreatedPortalResponse {
  portals: Array<{
    slug: string;
    world: World;
    name: string;
  }>;
}

interface CreatedPlaceResponse {
  place: {
    slug: string;
    name: string;
    imageUrl?: string | null;
  };
}

type TradeItemForm = {
  itemId: string;
  quantity: string;
  customName: string;
  enchanted: boolean;
};

type TradeOfferForm = {
  id: string;
  gives: TradeItemForm;
  wants: TradeItemForm;
  negotiable: boolean;
};

const generateFormId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

const createTradeItem = (): TradeItemForm => ({
  itemId: '',
  quantity: '',
  customName: '',
  enchanted: false,
});

const createTradeOffer = (): TradeOfferForm => ({
  id: generateFormId(),
  gives: createTradeItem(),
  wants: createTradeItem(),
  negotiable: false,
});

const blankCoords: CoordinatesState = { x: '', y: '', z: '' };

const slugify = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
};

const parseOwners = (input: string): string[] => {
  return input
    .split(/[\n,;]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const parseTags = (input: string): string[] => {
  return Array.from(
    new Set(
      input
        .split(/[\n,;]+/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    )
  );
};

const parseCoordinateTriplet = (coords: CoordinatesState) => {
  const x = Number(coords.x);
  const y = Number(coords.y);
  const z = Number(coords.z);
  if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
    return null;
  }
  return { x, y, z };
};

const inputClass = `${themeColors.input.search} border ${themeColors.util.roundedLg} px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder}`;

const sectionTitleClass = `text-sm font-semibold ${themeColors.text.secondary} ${themeColors.transition}`;

const SubHeader: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
  <div className="space-y-0.5">
    <h3 className={sectionTitleClass}>{title}</h3>
    {description && (
      <p className={`text-xs ${themeColors.text.quaternary}`}>{description}</p>
    )}
  </div>
);

const AddPortalOverlay: React.FC<AddPortalOverlayProps> = ({ onClose, closing = false }) => {
  const [portalVariant, setPortalVariant] = useState<'overworld' | 'nether' | 'linked'>('overworld');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [ownersInput, setOwnersInput] = useState('');
  const [singleCoords, setSingleCoords] = useState<CoordinatesState>(blankCoords);
  const [singleAddress, setSingleAddress] = useState('');
  const [singleAddressManual, setSingleAddressManual] = useState(false);
  const [singleAddressLoading, setSingleAddressLoading] = useState(false);
  const [singleAddressError, setSingleAddressError] = useState<string | null>(null);

  const [overworldCoords, setOverworldCoords] = useState<CoordinatesState>(blankCoords);
  const [netherCoords, setNetherCoords] = useState<CoordinatesState>(blankCoords);
  const [description, setDescription] = useState('');
  const [netherAddress, setNetherAddress] = useState('');
  const [netherAddressManual, setNetherAddressManual] = useState(false);
  const [netherAddressLoading, setNetherAddressLoading] = useState(false);
  const [netherAddressError, setNetherAddressError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<CreatedPortalResponse | null>(null);
  const [activeCategory, setActiveCategory] = useState<'portal' | 'place'>('portal');
  const [placeName, setPlaceName] = useState('');
  const [placeSlug, setPlaceSlug] = useState('');
  const [placeSlugManuallyEdited, setPlaceSlugManuallyEdited] = useState(false);
  const [placeWorld, setPlaceWorld] = useState<World>('overworld');
  const [placeCoords, setPlaceCoords] = useState<CoordinatesState>(blankCoords);
  const [placeOwnersInput, setPlaceOwnersInput] = useState('');
  const [placeTagsInput, setPlaceTagsInput] = useState('');
  const [placeDescription, setPlaceDescription] = useState('');
  const [placeDiscordUrl, setPlaceDiscordUrl] = useState('');
  const [placeImageUrl, setPlaceImageUrl] = useState('');
  const [placeImagePreviewError, setPlaceImagePreviewError] = useState(false);
  const [placeTradeOffers, setPlaceTradeOffers] = useState<TradeOfferForm[]>([]);
  const [placeSubmitting, setPlaceSubmitting] = useState(false);
  const [placeSubmitError, setPlaceSubmitError] = useState<string | null>(null);
  const [placeSuccessData, setPlaceSuccessData] = useState<CreatedPlaceResponse | null>(null);
  const animIn = useOverlayPanelAnimation(!closing, { closing });

  const isLinkedVariant = portalVariant === 'linked';
  const singleWorld: World = portalVariant === 'nether' ? 'nether' : 'overworld';

  const singleAddressRequestId = useRef(0);
  const linkedAddressRequestId = useRef(0);

  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(slugify(name));
    }
  }, [name, slugManuallyEdited]);

  useEffect(() => {
    if (!placeSlugManuallyEdited) {
      setPlaceSlug(slugify(placeName));
    }
  }, [placeName, placeSlugManuallyEdited]);

  useEffect(() => {
    setPlaceImagePreviewError(false);
  }, [placeImageUrl]);

  const ownersList = useMemo(() => parseOwners(ownersInput), [ownersInput]);
  const placeOwnersList = useMemo(() => parseOwners(placeOwnersInput), [placeOwnersInput]);
  const placeTagsList = useMemo(() => parseTags(placeTagsInput), [placeTagsInput]);

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

  const resetPlaceForm = () => {
    setPlaceName('');
    setPlaceSlug('');
    setPlaceSlugManuallyEdited(false);
    setPlaceWorld('overworld');
    setPlaceCoords(blankCoords);
    setPlaceOwnersInput('');
    setPlaceTagsInput('');
    setPlaceDescription('');
    setPlaceDiscordUrl('');
    setPlaceImageUrl('');
    setPlaceImagePreviewError(false);
    setPlaceTradeOffers([]);
  };

  const resetPortalForm = () => {
    setPortalVariant('overworld');
    setName('');
    setSlug('');
    setSlugManuallyEdited(false);
    setOwnersInput('');
    setSingleCoords(blankCoords);
    setSingleAddress('');
    setSingleAddressManual(false);
    setSingleAddressError(null);
    setSingleAddressLoading(false);
    setOverworldCoords(blankCoords);
    setNetherCoords(blankCoords);
    setDescription('');
    setNetherAddress('');
    setNetherAddressManual(false);
    setNetherAddressError(null);
    setNetherAddressLoading(false);
  };

  const addTradeOffer = () => {
    setPlaceTradeOffers((prev) => [...prev, createTradeOffer()]);
  };

  const removeTradeOffer = (offerId: string) => {
    setPlaceTradeOffers((prev) => prev.filter((offer) => offer.id !== offerId));
  };

  const updateTradeItem = <K extends keyof TradeItemForm>(
    offerId: string,
    kind: 'gives' | 'wants',
    field: K,
    value: TradeItemForm[K]
  ) => {
    setPlaceTradeOffers((prev) =>
      prev.map((offer) => {
        if (offer.id !== offerId) {
          return offer;
        }
        return {
          ...offer,
          [kind]: {
            ...offer[kind],
            [field]: value,
          },
        };
      })
    );
  };

  const setOfferNegotiable = (offerId: string, negotiable: boolean) => {
    setPlaceTradeOffers((prev) =>
      prev.map((offer) => (offer.id === offerId ? { ...offer, negotiable } : offer))
    );
  };

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

        const response = await fetch('/api/portals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Impossible de créer le portail.');
        }

        const data: CreatedPortalResponse = await response.json();
        resetPortalForm();
        setSuccessData(data);
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

        const response = await fetch('/api/portals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Impossible de créer les portails.');
        }

        const data: CreatedPortalResponse = await response.json();
        resetPortalForm();
        setSuccessData(data);
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

  const handlePlaceSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (placeSubmitting) return;
    setPlaceSubmitError(null);

    if (!placeName.trim()) {
      setPlaceSubmitError('Le nom du lieu est requis.');
      return;
    }

    const targetSlug = slugify(placeSlugManuallyEdited ? placeSlug : placeName);
    if (!targetSlug) {
      setPlaceSubmitError('Veuillez renseigner un identifiant valide.');
      return;
    }

    const coords = parseCoordinateTriplet(placeCoords);
    if (!coords) {
      setPlaceSubmitError('Les coordonnées du lieu sont invalides.');
      return;
    }

    for (const offer of placeTradeOffers) {
      const givesId = offer.gives.itemId.trim();
      if (!givesId) {
        setPlaceSubmitError('Chaque offre doit préciser au moins un objet proposé.');
        return;
      }
      const givesQty = Number.parseInt(offer.gives.quantity, 10);
      if (!Number.isFinite(givesQty) || givesQty <= 0) {
        setPlaceSubmitError('La quantité proposée doit être un entier positif.');
        return;
      }

      if (!offer.negotiable) {
        const wantsId = offer.wants.itemId.trim();
        if (!wantsId) {
          setPlaceSubmitError('Précisez l\'objet demandé ou marquez l\'offre comme négociable.');
          return;
        }
        const wantsQty = Number.parseInt(offer.wants.quantity, 10);
        if (!Number.isFinite(wantsQty) || wantsQty <= 0) {
          setPlaceSubmitError('La quantité demandée doit être un entier positif.');
          return;
        }
      }
    }

    const tradeOffersPayload = placeTradeOffers.map((offer) => {
      const items: Prisma.TradeItemCreateManyOfferInput[] = [
        {
          kind: 'gives',
          itemId: offer.gives.itemId.trim(),
          quantity: Math.max(1, Number.parseInt(offer.gives.quantity, 10) || 1),
          enchanted: offer.gives.enchanted,
          customName: offer.gives.customName.trim() || null,
        },
      ];

      if (!offer.negotiable && offer.wants.itemId.trim()) {
        items.push({
          kind: 'wants' as const,
          itemId: offer.wants.itemId.trim(),
          quantity: Math.max(1, Number.parseInt(offer.wants.quantity, 10) || 1),
          enchanted: offer.wants.enchanted,
          customName: offer.wants.customName.trim() || null,
        });
      }

      return {
        negotiable: offer.negotiable,
        items,
      };
    });

    if (placeImageUrl.trim() && placeImagePreviewError) {
      setPlaceSubmitError('L\'aperçu de l\'image est invalide. Vérifiez l\'URL et essayez à nouveau.');
      return;
    }

    const payload = {
      slug: targetSlug,
      name: placeName.trim(),
      world: placeWorld,
      coordinates: coords,
      description: placeDescription.trim() || null,
      owners: placeOwnersList,
      tags: placeTagsList,
      discordUrl: placeDiscordUrl.trim() || null,
      imageUrl: placeImageUrl.trim() || null,
      tradeOffers: tradeOffersPayload,
    };

    try {
      setPlaceSubmitting(true);
      const response = await fetch('/api/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData: { error?: string } = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Impossible de créer le lieu.');
      }

      const data: CreatedPlaceResponse = await response.json();
      setPlaceSuccessData(data);
      resetPlaceForm();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inattendue.';
      setPlaceSubmitError(message);
    } finally {
      setPlaceSubmitting(false);
    }
  };

  const renderOwnersInput = (
    value: string,
    setValue: (next: string) => void,
    placeholder = 'Doviculus22, spacenewbie'
  ) => (
    <div className="space-y-1">
      <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Propriétaires (séparés par une virgule)</label>
      <textarea
        className={`${inputClass} resize-y min-h-[40px] leading-5`}
        placeholder={placeholder}
        value={value}
        rows={1}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
          }
        }}
        onChange={(event) => setValue(event.target.value.replace(/\n+/g, ', '))}
      />
    </div>
  );

  const renderCoordinateInputs = (
    coords: CoordinatesState,
    setCoords: React.Dispatch<React.SetStateAction<CoordinatesState>>,
    label?: string
  ) => (
    <div className="space-y-1">
      {label && <label className={`text-xs font-medium ${themeColors.text.secondary}`}>{label}</label>}
      <div className="grid grid-cols-3 gap-2">
        {(['x', 'y', 'z'] as Array<keyof CoordinatesState>).map((axis) => (
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

const renderTradeOffersSection = () => (
  <div className="space-y-3">
    <SubHeader
      title="Offres commerciales"
      description="Décrivez les échanges disponibles sur place pour les autres joueurs."
    />
    {placeTradeOffers.map((offer, index) => {
        const wantDisabled = offer.negotiable;
        const disabledClass = wantDisabled ? 'cursor-not-allowed opacity-60' : '';
        return (
          <div
            key={offer.id}
            className={`space-y-4 p-4 border ${themeColors.border.primary} ${themeColors.panel.secondary} ${themeColors.util.roundedLg}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className={`text-sm font-semibold ${themeColors.text.secondary}`}>Offre #{index + 1}</span>
              <button
                type="button"
                onClick={() => removeTradeOffer(offer.id)}
                className="text-xs font-medium text-red-500 hover:text-red-400 transition-colors"
              >
                Supprimer
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Produit proposé</label>
                <input
                  className={inputClass}
                  placeholder="Minecraft ID (ex : bow)"
                  value={offer.gives.itemId}
                  onChange={(event) => updateTradeItem(offer.id, 'gives', 'itemId', event.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className={inputClass}
                    type="number"
                    min={1}
                    inputMode="numeric"
                    placeholder="Quantité"
                    value={offer.gives.quantity}
                    onChange={(event) => updateTradeItem(offer.id, 'gives', 'quantity', event.target.value)}
                  />
                  <button
                    type="button"
                    aria-pressed={offer.gives.enchanted}
                    onClick={() => updateTradeItem(offer.id, 'gives', 'enchanted', !offer.gives.enchanted)}
                    className={`inline-flex items-center justify-center gap-2 text-xs font-medium px-3 py-1 ${themeColors.util.roundedLg} transition-colors duration-300 border ${
                      offer.gives.enchanted
                        ? 'bg-purple-100/60 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700'
                        : 'bg-gray-100/30 dark:bg-gray-700/15 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200/40 dark:hover:bg-gray-600/20'
                    }`}
                  >
                    {offer.gives.enchanted ? 'Item enchanté' : 'Item non enchanté'}
                  </button>
                </div>
                <input
                  className={inputClass}
                  placeholder="Nom personnalisé (facultatif)"
                  value={offer.gives.customName}
                  onChange={(event) => updateTradeItem(offer.id, 'gives', 'customName', event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Produit demandé</label>
                <input
                  className={`${inputClass} ${disabledClass}`}
                  placeholder="Minecraft ID (ex : diamond_block)"
                  value={offer.wants.itemId}
                  onChange={(event) => updateTradeItem(offer.id, 'wants', 'itemId', event.target.value)}
                  disabled={wantDisabled}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className={`${inputClass} ${disabledClass}`}
                    type="number"
                    min={1}
                    inputMode="numeric"
                    placeholder="Quantité"
                    value={offer.wants.quantity}
                    onChange={(event) => updateTradeItem(offer.id, 'wants', 'quantity', event.target.value)}
                    disabled={wantDisabled}
                  />
                  <button
                    type="button"
                    aria-pressed={offer.wants.enchanted}
                    onClick={() => updateTradeItem(offer.id, 'wants', 'enchanted', !offer.wants.enchanted)}
                    disabled={wantDisabled}
                    className={`inline-flex items-center justify-center gap-2 text-xs font-medium px-3 py-1 ${themeColors.util.roundedLg} transition-colors duration-300 border ${
                      wantDisabled
                        ? 'cursor-not-allowed opacity-60'
                        : ''
                    } ${
                      offer.wants.enchanted
                        ? 'bg-purple-100/60 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700'
                        : 'bg-gray-100/30 dark:bg-gray-700/15 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200/40 dark:hover:bg-gray-600/20'
                    }`}
                  >
                    {offer.wants.enchanted ? 'Item enchanté' : 'Item non enchanté'}
                  </button>
                </div>
                <input
                  className={`${inputClass} ${disabledClass}`}
                  placeholder="Nom personnalisé (facultatif)"
                  value={offer.wants.customName}
                  onChange={(event) => updateTradeItem(offer.id, 'wants', 'customName', event.target.value)}
                  disabled={wantDisabled}
                />
                {offer.negotiable && (
                  <p className={`text-xs italic ${themeColors.text.tertiary}`}>
                    Cette offre sera affichée comme négociable, sans prix fixe.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setOfferNegotiable(offer.id, false)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors duration-300 ${
                  !offer.negotiable
                    ? 'bg-blue-100/50 dark:bg-blue-800/20 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100/30 dark:bg-gray-700/15 text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-600/20'
                }`}
              >
                Prix fixe
              </button>
              <button
                type="button"
                onClick={() => setOfferNegotiable(offer.id, true)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors duration-300 ${
                  offer.negotiable
                    ? 'bg-blue-100/50 dark:bg-blue-800/20 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100/30 dark:bg-gray-700/15 text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-600/20'
                }`}
              >
                Négociable
              </button>
            </div>
          </div>
        );
      })}
    <button
      type="button"
      onClick={addTradeOffer}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-dashed ${themeColors.border.primary} ${themeColors.util.roundedLg} ${themeColors.transitionAll} text-gray-700 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100/20 dark:hover:bg-blue-500/10`}
    >
      Ajouter une offre
    </button>
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

const renderSingleForm = (world: World) => {
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

  const renderPortalContent = () => {
    if (successData) {
      return (
        <div className="py-6">
          <div className={`${themeColors.panel.secondary} border ${themeColors.border.primary} ${themeColors.util.roundedXl} shadow-sm px-6 py-5 space-y-5`}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100/80 dark:bg-emerald-900/30">
                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className={`text-lg font-semibold ${themeColors.text.primary}`}>Portail enregistré</h3>
                <p className={`text-sm ${themeColors.text.secondary}`}>
                  Merci ! Votre portail sera visible après validation par l’équipe.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {successData.portals.map((portal) => (
                <div key={`${portal.slug}-${portal.world}`} className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-emerald-200 dark:border-emerald-800 px-3 py-2">
                  <div>
                    <div className={`text-sm font-semibold ${themeColors.text.primary}`}>{portal.name}</div>
                    <div className={`text-xs ${themeColors.text.secondary}`}>{portal.slug}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold ${themeColors.util.roundedFull} ${
                      portal.world === 'overworld' ? themeColors.world.overworld : themeColors.world.nether
                    }`}
                  >
                    {portal.world}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  resetPortalForm();
                  setSuccessData(null);
                }}
                className={`px-4 py-2 text-sm ${themeColors.button.primary} ${themeColors.util.roundedLg} ${themeColors.transitionAll}`}
              >
                Ajouter un autre portail
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 text-sm ${themeColors.util.roundedLg} border ${themeColors.border.primary} ${themeColors.transitionAll} text-gray-700 dark:text-gray-200 bg-transparent hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100/20 dark:hover:bg-blue-500/10`}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Nom du portail</label>
            <input
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Portail du marché impérial de Valnyfrost"
            />
          </div>

          <div className="space-y-1">
            <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Identifiant (slug)</label>
            <input
              className={inputClass}
              value={slugManuallyEdited ? slug : slugify(name)}
              onChange={(event) => {
                setSlug(event.target.value);
                setSlugManuallyEdited(true);
              }}
              placeholder="valny-portail-marche-imperial"
            />
          </div>

          {renderOwnersInput(ownersInput, setOwnersInput)}

          <div className="space-y-1">
            <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Description (optionnel)</label>
            <textarea
              className={`${inputClass} min-h-[80px] resize-y`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </div>

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
                    ? 'bg-purple-100/60 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300'
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

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 text-sm ${themeColors.util.roundedLg} border ${themeColors.border.primary} ${themeColors.transitionAll} text-gray-700 dark:text-gray-200 bg-transparent hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100/20 dark:hover:bg-blue-500/10`}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`px-4 py-2 text-sm ${themeColors.button.primary} ${themeColors.util.roundedLg} ${themeColors.transitionAll} disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {submitting ? 'Création…' : 'Créer le portail'}
          </button>
        </div>
      </form>
    );
  };

  const renderPlaceContent = () => {
    if (placeSuccessData) {
      return (
        <div className="py-6">
          <div className={`${themeColors.panel.secondary} border ${themeColors.border.primary} ${themeColors.util.roundedXl} shadow-sm px-6 py-5 space-y-5`}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100/80 dark:bg-blue-900/30">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className={`text-lg font-semibold ${themeColors.text.primary}`}>Lieu enregistré</h3>
                <p className={`text-sm ${themeColors.text.secondary}`}>
                  Merci ! Le lieu sera visible une fois qu’il aura été vérifié par l’équipe.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {placeSuccessData.place.imageUrl && (
                <div className="flex justify-center">
                  <img
                    src={placeSuccessData.place.imageUrl}
                    alt={placeSuccessData.place.name}
                    className={`h-32 w-auto max-w-full object-contain border ${themeColors.border.primary} ${themeColors.util.roundedLg}`}
                  />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div className={`text-base font-semibold ${themeColors.text.primary}`}>{placeSuccessData.place.name}</div>
                <div className={`text-xs ${themeColors.text.secondary}`}>{placeSuccessData.place.slug}</div>
                {placeSuccessData.place.imageUrl ? null : (
                  <p className={`text-xs ${themeColors.text.secondary}`}>
                    Astuce : ajoutez une image pour aider les joueurs à repérer votre lieu.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  resetPlaceForm();
                  setPlaceSuccessData(null);
                }}
                className={`px-4 py-2 text-sm ${themeColors.button.primary} ${themeColors.util.roundedLg} ${themeColors.transitionAll}`}
              >
                Ajouter un autre lieu
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 text-sm ${themeColors.util.roundedLg} border ${themeColors.border.primary} ${themeColors.transitionAll} text-gray-700 dark:text-gray-200 bg-transparent hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100/20 dark:hover:bg-blue-500/10`}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <form className="space-y-5" onSubmit={handlePlaceSubmit}>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Nom du lieu</label>
            <input
              className={inputClass}
              value={placeName}
              onChange={(event) => setPlaceName(event.target.value)}
              placeholder="Marché impérial de Valnyfrost"
            />
          </div>

          <div className="space-y-1">
            <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Identifiant (slug)</label>
            <input
              className={inputClass}
              value={placeSlugManuallyEdited ? placeSlug : slugify(placeName)}
              onChange={(event) => {
                setPlaceSlug(event.target.value);
                setPlaceSlugManuallyEdited(true);
              }}
              placeholder="valny-marche-imperial"
            />
          </div>

          {renderOwnersInput(placeOwnersInput, setPlaceOwnersInput, 'Doviculus22, spacenewbie')}

          <div className="space-y-1">
            <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Tags (séparés par une virgule)</label>
            <textarea
              className={`${inputClass} resize-y min-h-[40px] leading-5`}
              value={placeTagsInput}
              rows={1}
              placeholder="valny, magasin"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                }
              }}
              onChange={(event) => setPlaceTagsInput(event.target.value.replace(/\n+/g, ', '))}
            />
          </div>

          <div className="space-y-1">
            <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Description (optionnel)</label>
            <textarea
              className={`${inputClass} min-h-[80px] resize-y`}
              value={placeDescription}
              onChange={(event) => setPlaceDescription(event.target.value)}
              placeholder="Présentez rapidement votre lieu, ses services et comment y accéder."
            />
          </div>

          <div className="space-y-1">
            <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Image (optionnel)</label>
            <input
              className={inputClass}
              value={placeImageUrl}
              onChange={(event) => setPlaceImageUrl(event.target.value)}
              placeholder="https://exemple.com/votre-image.png"
              inputMode="url"
            />
            {placeImageUrl && (
              <div className={`relative mt-2 overflow-hidden border ${themeColors.border.primary} ${themeColors.util.roundedLg} ${themeColors.panel.secondary} flex items-center justify-center max-w-xs`}>
                {!placeImagePreviewError ? (
                  <img
                    src={placeImageUrl}
                    alt="Aperçu du lieu"
                    className="max-h-64 w-auto object-contain"
                    onError={() => setPlaceImagePreviewError(true)}
                  />
                ) : (
                  <div className="p-4 text-center text-xs text-red-500">
                    Impossible de charger cette image. Vérifiez l&apos;URL ou essayez une autre source.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Lien Discord (optionnel)</label>
            <input
              className={inputClass}
              value={placeDiscordUrl}
              onChange={(event) => setPlaceDiscordUrl(event.target.value)}
              placeholder="https://discord.gg/votre-serveur"
              inputMode="url"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:gap-3">
            <div className="space-y-1 md:mr-3">
              <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Monde</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPlaceWorld('overworld')}
                  className={`px-3 py-1.5 text-sm ${themeColors.util.roundedFull} font-medium ${themeColors.transition} ${
                    placeWorld === 'overworld'
                      ? themeColors.world.overworld
                      : `${themeColors.button.ghost} ${themeColors.interactive.hover}`
                  }`}
                >
                  overworld
                </button>
                <button
                  type="button"
                  onClick={() => setPlaceWorld('nether')}
                  className={`px-3 py-1.5 text-sm ${themeColors.util.roundedFull} font-medium ${themeColors.transition} ${
                    placeWorld === 'nether'
                      ? themeColors.world.nether
                      : `${themeColors.button.ghost} ${themeColors.interactive.hover}`
                  }`}
                >
                  nether
                </button>
              </div>
            </div>
            <div className="flex-1">
              {renderCoordinateInputs(placeCoords, setPlaceCoords, 'Coordonnées du lieu')}
            </div>
          </div>
          {renderTradeOffersSection()}
        </div>

        {placeSubmitError && (
          <div className={`text-sm ${themeColors.travelPlan.errorIcon}`}>{placeSubmitError}</div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 text-sm ${themeColors.util.roundedLg} border ${themeColors.border.primary} ${themeColors.transitionAll} text-gray-700 dark:text-gray-200 bg-transparent hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100/20 dark:hover:bg-blue-500/10`}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={placeSubmitting}
            className={`px-4 py-2 text-sm ${themeColors.button.primary} ${themeColors.util.roundedLg} ${themeColors.transitionAll} disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {placeSubmitting ? 'Création…' : 'Créer le lieu'}
          </button>
        </div>
      </form>
    );
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
            <h2 className={`text-2xl font-bold ${themeColors.text.primary} ${themeColors.transition}`}>Ajouter un lieu ou un portail</h2>
            <p className={`text-sm ${themeColors.text.tertiary}`}>Sélectionnez la catégorie puis complétez le formulaire correspondant.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 ${themeColors.util.roundedFull} ${themeColors.button.secondary} border ${themeColors.border.light} ${themeColors.shadow.button} transition-all duration-200 ${themeColors.util.hoverScale} ${themeColors.util.activeScale}`}
            aria-label="Fermer"
          >
            <svg className={`w-4 h-4 ${themeColors.text.secondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative flex-1 min-h-0 overflow-hidden rounded-b-xl">
          <div className={`absolute top-0 left-0 right-0 h-20 gradient-top-solid-blur z-10 pointer-events-none ${themeColors.transition}`} />
          <div className={`absolute bottom-0 left-0 right-0 h-2 ${themeColors.gradient.bottomSolid} z-10 pointer-events-none ${themeColors.transition}`} />
          <div className={`absolute bottom-2 left-0 right-0 h-8 ${themeColors.gradient.bottomBlur} z-10 pointer-events-none ${themeColors.transition}`} />

          <div className="absolute top-0 left-0 right-0 px-6 pt-4 pb-2 z-20 flex gap-2 items-center">
            <button
              type="button"
              aria-pressed={activeCategory === 'portal'}
              onClick={() => setActiveCategory('portal')}
              className={`px-3 py-1 text-sm rounded-full font-medium transition-colors duration-300 ${
                activeCategory === 'portal'
                  ? 'bg-blue-100/50 dark:bg-blue-800/20 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100/30 dark:bg-gray-700/15 text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-600/20'
              }`}
            >
              Portail
            </button>
            <button
              type="button"
              aria-pressed={activeCategory === 'place'}
              onClick={() => setActiveCategory('place')}
              className={`px-3 py-1 text-sm rounded-full font-medium transition-colors duration-300 ${
                activeCategory === 'place'
                  ? 'bg-blue-100/50 dark:bg-blue-800/20 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100/30 dark:bg-gray-700/15 text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-600/20'
              }`}
            >
              Lieu
            </button>
          </div>

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
                {renderPortalContent()}
              </div>
              <div
                className={`w-1/2 min-w-0 flex-shrink-0 h-full overflow-y-auto px-6 pt-16 pb-14 ${themeColors.panel.primary} ${themeColors.transition}`}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                aria-hidden={activeCategory !== 'place'}
              >
                {renderPlaceContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPortalOverlay;
