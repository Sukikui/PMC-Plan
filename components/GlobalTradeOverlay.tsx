'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Place, TradeOffer } from '@/app/api/utils/shared';
import { themeColors } from '@/lib/theme-colors';
import PlusIcon from '@/components/icons/PlusIcon';
import CrossIcon from '@/components/icons/CrossIcon';
import { getRenderUrl } from '@/lib/starlight-skin-api';
import InfoIcon from '@/components/icons/InfoIcon';
import ItemInline from '@/components/trade/ItemInline';
import { useOverlay } from '@/components/overlay/OverlayProvider';
import { useOverlayPanelAnimation } from '@/components/ui/useOverlayPanelAnimation';

interface GlobalTradeOverlayProps {
  offers?: TradeOffer[] | null;
  onBack?: () => void;
  onClose?: () => void;
  closing?: boolean;
  onSelectItem?: (id: string, type: 'place' | 'portal') => void;
}

type GlobalOffer = { offer: TradeOffer; place: { id: string; name: string; owners: string[] } };

// Global marketplace overlay with TradeOverlay styling
export default function GlobalTradeOverlay({ offers = null, onBack, onClose, closing = false, onSelectItem }: GlobalTradeOverlayProps) {
  const { openPlaceInfoById } = useOverlay();
  const [query, setQuery] = useState('');
  const [data, setData] = useState<GlobalOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<null | { left: number; top: number; owners: string[] }>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animIn = useOverlayPanelAnimation(!closing, { closing });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (offers && Array.isArray(offers)) return; // external data provided
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/places');
        if (!res.ok) throw new Error('Impossible de charger les lieux');
        const places: Place[] = await res.json();
        if (cancelled) return;
        const flattened: GlobalOffer[] = [];
        for (const p of places) {
          if (Array.isArray(p.trade)) {
            const owners = Array.isArray(p.owners) ? p.owners : [];
            for (const o of p.trade) flattened.push({ offer: o, place: { id: p.id, name: p.name, owners } });
          }
        }
        setData(flattened);
      } catch (e: unknown) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : 'Erreur inattendue';
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [offers]);

  const sourceList: GlobalOffer[] = useMemo(() => {
    if (offers && Array.isArray(offers)) {
      return (offers as TradeOffer[]).map(o => ({ offer: o, place: { id: '', name: 'Lieu inconnu', owners: [] } }));
    }
    return data;
  }, [offers, data]);

  const list = useMemo(() => {
    if (!query) return sourceList;
    const q = query.toLowerCase().replace(/\s+/g, '');
    return sourceList.filter(({ offer: o, place }) =>
      o.gives.item_id.toLowerCase().includes(q) ||
      o.wants.item_id.toLowerCase().includes(q) ||
      (o.gives.custom_name && o.gives.custom_name.toLowerCase().includes(q)) ||
      (o.wants.custom_name && o.wants.custom_name.toLowerCase().includes(q)) ||
      place.name.toLowerCase().includes(q) ||
      (place.owners && place.owners.some(owner => owner.toLowerCase().includes(q)))
    );
  }, [sourceList, query]);

  return (
    <div
      ref={containerRef}
      className={`relative ${themeColors.panel.primary} ${themeColors.blur} ${themeColors.util.roundedXl} [box-shadow:0_0_25px_0_var(--tw-shadow-color)] ${themeColors.shadow.overlay.place} w-full max-w-5xl min-w-0 h-[min(90vh,calc(100vh-4rem))] border ${themeColors.border.primary} flex flex-col transition-all duration-300 ease-out`}
      style={{
        width: 'min(72rem, calc(100vw - 2rem))',
        transform: animIn ? 'translateY(0)' : 'translateY(100%)',
      }}
    >
      {/* Header */}
      <div className={`flex-shrink-0 p-6 border-b ${themeColors.border.primary} ${themeColors.panel.primary} ${themeColors.transition} rounded-t-xl`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className={`text-2xl font-bold ${themeColors.text.primary} ${themeColors.transition}`}>Marché global</h2>
            <p className={`text-sm ${themeColors.text.tertiary} ${themeColors.transition} mt-0.5`}>
              {loading ? 'Chargement…' : `${list.length} offre${list.length > 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            {onBack && (
              <button
                onClick={onBack}
                className={`p-1 ${themeColors.util.roundedFull} ${themeColors.button.secondary} border ${themeColors.border.light} ${themeColors.shadow.button} transition-all duration-200 ${themeColors.util.hoverScale} ${themeColors.util.activeScale} flex-shrink-0 ${themeColors.interactive.hoverBorder}`}
                aria-label="Retour"
              >
                <PlusIcon className={`w-4 h-4 ${themeColors.text.secondary} transform rotate-45`} />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className={`p-1 ${themeColors.util.roundedFull} ${themeColors.button.secondary} border ${themeColors.border.light} ${themeColors.shadow.button} transition-all duration-200 ${themeColors.util.hoverScale} ${themeColors.util.activeScale} flex-shrink-0 ${themeColors.interactive.hoverBorder}`}
                aria-label="Fermer"
              >
                <CrossIcon className={`w-4 h-4 ${themeColors.text.secondary}`} />
              </button>
            )}
          </div>
        </div>

        {/* (Search moved above content, over top gradient) */}
      </div>

      {/* Content */}
      <div className={`relative flex-1 min-h-0 ${themeColors.panel.primary} ${themeColors.transition} rounded-b-xl overflow-hidden`}>
        {/* Top gradient */}
        <div className={`absolute top-0 left-0 right-0 h-20 gradient-top-solid-blur z-10 pointer-events-none ${themeColors.transition}`} />

        {/* Search Bar - positioned over top gradient */}
        <div className="absolute top-0 left-0 right-0 z-20 px-8 pt-4 pb-2">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit, une monnaie, un vendeur, un lieu..."
              className={`w-full h-8 px-3 text-sm ${themeColors.input.search} border ${themeColors.util.roundedLg} focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder}`}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${themeColors.text.secondary} ${themeColors.interactive.hoverText} ${themeColors.transition}`}
                aria-label="Effacer la recherche"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="h-full overflow-y-auto px-8 pt-[4.5rem] pb-12 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

          {error && (
            <div className={`text-center py-8 ${themeColors.text.tertiary}`}>{error}</div>
          )}

          {!error && list.length === 0 && !loading && (
            <div className={`text-center py-8 ${themeColors.text.tertiary}`}>Aucune offre globale disponible</div>
          )}

          {!error && list.length > 0 && (
            <div className="space-y-4">
              {/* Header row: Lieu / Propose / Demande (aligned with columns) */}
              <div className="flex items-center gap-x-3 px-1">
                {/* Vendeur spacer */}
                <div className="w-8 h-8" />
                {/* Separator */}
                <div className={`h-6 w-px ${themeColors.border.light}`} />
                {/* Lieu */}
                <div className={`text-sm font-semibold ${themeColors.text.secondary} uppercase tracking-wide w-56 text-center`}>
                  Lieu
                </div>
                
                {/* Separator */}
                <div className={`h-6 w-px ${themeColors.border.light}`} />
                {/* Propose */}
                <div className={`text-sm font-semibold ${themeColors.text.secondary} uppercase tracking-wide flex-1 min-w-[14rem] text-center`}>
                  Propose
                </div>
                {/* Arrow spacer + separator */}
                <div className="w-6 mx-2" />
                <div className={`h-6 w-px ${themeColors.border.light}`} />
                {/* Demande */}
                <div className={`text-sm font-semibold ${themeColors.text.secondary} uppercase tracking-wide flex-1 min-w-[14rem] text-center`}>
                  Demande
                </div>
              </div>
              {list.map(({ offer, place }, idx) => {
                const primaryOwner = place.owners[0] ?? null;
                return (
                <div key={idx} className={`${themeColors.infoOverlay.descriptionBg} border ${themeColors.border.primary} ${themeColors.util.roundedLg} px-3 py-2 ${themeColors.transition}`}>
                  <div className="flex items-center gap-x-3">
                    {/* Vendeur (owner) */}
                    {primaryOwner ? (
                      <div className="relative flex items-center">
                        <img
                          src={getRenderUrl(primaryOwner, { renderType: 'head', crop: 'full', borderHighlight: true, borderHighlightRadius: 6, dropShadow: true })}
                          alt={`Skin de ${primaryOwner}`}
                          className="w-8 h-8 object-contain transition-transform duration-200 hover:scale-110"
                          style={{ imageRendering: 'pixelated' }}
                          crossOrigin="anonymous"
                          onMouseEnter={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            const imgRect = img.getBoundingClientRect();
                            const rootRect = containerRef.current?.getBoundingClientRect();
                            if (rootRect) {
                              setTooltip({
                                left: imgRect.left - rootRect.left + imgRect.width / 2,
                                top: imgRect.top - rootRect.top - 8,
                                owners: place.owners,
                              });
                            }
                          }}
                          onMouseMove={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            const imgRect = img.getBoundingClientRect();
                            const rootRect = containerRef.current?.getBoundingClientRect();
                            if (rootRect && tooltip) {
                              setTooltip({
                                left: imgRect.left - rootRect.left + imgRect.width / 2,
                                top: imgRect.top - rootRect.top - 8,
                                owners: tooltip.owners,
                              });
                            }
                          }}
                          onMouseLeave={() => setTooltip(null)}
                          onError={() => {}}
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8" />
                    )}

                    {/* Separator */}
                    <div className={`h-8 w-px ${themeColors.border.light} flex-shrink-0`} />

                    {/* Lieu avec icône info (à gauche) - texte cliquable */}
                    <div className={`text-sm ${themeColors.text.quaternary} w-56 leading-snug pr-2`}>
                      <button
                        onClick={() => {
                          openPlaceInfoById(place.id, onSelectItem);
                          // Let the info overlay mount its backdrop before closing market to avoid flicker
                          setTimeout(() => { onClose?.(); }, 80);
                        }}
                        className={`w-full text-left inline-flex items-center gap-2 ${themeColors.transitionAll} outline-none hover:text-blue-600 dark:hover:text-blue-300 cursor-pointer`}
                        style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}
                        aria-label={`Ouvrir la fiche de ${place.name}`}
                      >
                        <InfoIcon className="w-4 h-4" />
                        <span className="font-medium min-w-0 break-words">{place.name}</span>
                      </button>
                    </div>

                    {/* Separator */}
                    <div className={`h-8 w-px ${themeColors.border.light} flex-shrink-0 mx-2`} />

                    {/* Items group (mirrors TradeOverlay spacing) */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-[14rem]">
                        <ItemInline item={offer.gives} />
                      </div>
                      <div className={`${themeColors.text.tertiary} flex-shrink-0 mx-2`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    <div className="flex-1 min-w-[14rem]">
                      {offer.negotiable ? (
                        <span className={`text-sm font-semibold ${themeColors.text.primary}`}>Sur demande</span>
                      ) : (
                        <ItemInline item={offer.wants} />
                      )}
                    </div>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>

        {/* Bottom gradients (solid + blur) */}
        <div className={`absolute bottom-0 left-0 right-0 h-2 ${themeColors.gradient.bottomSolid} z-10 pointer-events-none ${themeColors.transition}`} />
        <div className={`absolute bottom-2 left-0 right-0 h-8 ${themeColors.gradient.bottomBlur} z-10 pointer-events-none ${themeColors.transition}`} />
      </div>
      {tooltip && (
        <div
          className={`absolute z-[10000] px-3 py-1.5 text-xs font-medium ${themeColors.util.roundedFull} ${themeColors.infoOverlay.placeTags} whitespace-nowrap`}
          style={{ left: tooltip.left, top: tooltip.top, transform: 'translate(-50%, -100%)' }}
        >
          <span className="opacity-75">Vendeur : </span>
          <span className="font-bold">
            {tooltip.owners.length > 1
              ? `${tooltip.owners[0]} (+${tooltip.owners.length - 1})`
              : (tooltip.owners[0] ?? 'Inconnu')}
          </span>
        </div>
      )}
    </div>
  );
}