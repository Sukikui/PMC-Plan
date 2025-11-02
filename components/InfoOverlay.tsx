'use client';

import React, { useCallback, useEffect, useState } from 'react';
import CrossIcon from './icons/CrossIcon';
import InfoIcon from './icons/InfoIcon';
import ShopIcon from './icons/ShopIcon';
import ClearIcon from './icons/ClearIcon';
import TargetIcon from './icons/TargetIcon';
import TradeOverlay from './TradeOverlay';

import { Place, Portal } from '../app/api/utils/shared';
import { getWorldBadgeLarge } from '../lib/ui-utils';
import { themeColors } from '../lib/theme-colors';
import { getRenderUrl } from '../lib/starlight-skin-api';
import Overlay from '@/components/ui/Overlay';
import { useOverlayPanelAnimation } from '@/components/ui/useOverlayPanelAnimation';

interface InfoOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  item: Place | Portal | null;
  type: 'place' | 'portal';
  onSelectItem?: (id: string, type: 'place' | 'portal') => void;
  withinOverlay?: boolean;
  closing?: boolean;
}

export default function InfoOverlay({
  isOpen,
  onClose,
  item,
  type,
  onSelectItem,
  withinOverlay = false,
  closing = false,
}: InfoOverlayProps) {
  const [showOwnerTooltip, setShowOwnerTooltip] = useState(false);
  const [showTradeView, setShowTradeView] = useState(false);
  const [tradeSearchQuery, setTradeSearchQuery] = useState<string>('');
  const [showBottomBlur, setShowBottomBlur] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const closeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = React.useRef(true);
  const [localClosing, setLocalClosing] = useState(false);
  const effectiveClosing = withinOverlay ? closing : localClosing;
  const animIn = useOverlayPanelAnimation(isOpen || effectiveClosing, { closing: effectiveClosing });

  const handleClose = useCallback(() => {
    if (withinOverlay) {
      onClose();
      return;
    }

    if (localClosing) return;

    setLocalClosing(true);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      onClose();
      if (isMountedRef.current) {
        setLocalClosing(false);
      }
    }, 300);
  }, [withinOverlay, onClose, localClosing]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  // Reset showTradeView when item changes or overlay closes
  useEffect(() => {
    if (!isOpen) {
      setShowTradeView(false);
    }
  }, [isOpen, item]);

  // Handle scroll blur effects
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        setShowBottomBlur(scrollTop + clientHeight < scrollHeight - 10);
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      handleScroll(); // Initial check
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, [showTradeView, isOpen, item]); // Re-run when content changes

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!withinOverlay && isOpen) {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setLocalClosing(false);
    }
  }, [isOpen, withinOverlay]);

  if ((!isOpen && !effectiveClosing) || !item) return null;

  const placeItem = type === 'place' ? (item as Place) : null;
  const primaryOwner = placeItem?.owners && placeItem.owners.length > 0 ? placeItem.owners[0] : null;
  const additionalOwners = placeItem?.owners && placeItem.owners.length > 1 ? placeItem.owners.slice(1) : [];

  const renderDescription = item.description && item.description.length > 0 ? (
    <div>
      <h3 className={`text-lg font-semibold ${themeColors.text.primary} mb-3 ${themeColors.transition}`}>Description</h3>
      <p className={`${themeColors.text.quaternary} leading-relaxed ${themeColors.infoOverlay.descriptionBg} p-4 ${themeColors.util.roundedLg} ${themeColors.transition}`}>
        {item.description}
      </p>
    </div>
  ) : null;

  const renderTags = (() => {
    if (type === 'place' && item) {
      const placeItem = item as Place;
      if (Array.isArray(placeItem.tags) && placeItem.tags.length > 0) {
        return (
          <div>
            <h3 className={`text-lg font-semibold ${themeColors.text.primary} mb-3 ${themeColors.transition}`}>Tags</h3>
            <div className="flex flex-wrap gap-2">
              {placeItem.tags.map(tag => (
                <span 
                  key={tag} 
                  className={`${themeColors.infoOverlay.placeTags} text-sm px-3 py-1 ${themeColors.util.roundedFull} font-medium ${themeColors.transition}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        );
      }
    }
    return null;
  })();


  const getTypeStyles = () => {
    if (type === 'place') {
      return {
        border: themeColors.border.primary,
        shadow: themeColors.shadow.overlay.place,
        headerBg: themeColors.panel.primary,
        headerBorder: themeColors.border.primary
      };
    } else {
      return {
        border: themeColors.border.primary,
        shadow: themeColors.shadow.overlay.portal,
        headerBg: themeColors.panel.primary,
        headerBorder: themeColors.border.primary
      };
    }
  };

  const typeStyles = getTypeStyles();

  const panel = (
    <div
      className={`relative ${themeColors.panel.primary} ${themeColors.blur} ${themeColors.util.roundedXl} [box-shadow:0_0_25px_0_var(--tw-shadow-color)] ${typeStyles.shadow} w-full max-w-2xl min-w-0 h-[min(90vh,calc(100vh-4rem))] border ${typeStyles.border} flex flex-col transition-all duration-300 ease-out`}
      style={{
        width: 'min(42rem, calc(100vw - 2rem))',
        transform: animIn ? 'translateY(0)' : 'translateY(100%)',
        opacity: animIn ? 1 : 0,
      }}
    >
          {/* Header */}
          <div className={`flex-shrink-0 p-6 border-b ${typeStyles.headerBorder} ${typeStyles.headerBg} ${themeColors.transition} rounded-t-xl`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2">
                  <h2 className={`inline text-2xl font-bold ${themeColors.text.primary} ${themeColors.transition}`}>{item.name}</h2>
                  {type === 'place' && (item as Place).discord && (
                    <a
                      href={(item as Place).discord!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-block ml-3.5 ${themeColors.link} ${themeColors.transitionAll} outline-none`}
                      style={{
                        backgroundColor: 'transparent !important',
                        border: 'none !important',
                        boxShadow: 'none !important',
                        verticalAlign: 'middle',
                        transform: 'translateY(-4px)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.border = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.197.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                    </a>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={getWorldBadgeLarge(item.world)}>
                    {item.world}
                  </span>
                  <div
                    onClick={() => {
                      if (onSelectItem) {
                        onSelectItem(item.id, type);
                      }
                      handleClose();
                    }}
                    className={`flex items-center gap-1 cursor-pointer group`}
                    aria-label="Sélectionner dans le panneau"
                  >
                    <span className={`text-sm ${themeColors.text.tertiary} group-hover:text-blue-500 dark:group-hover:text-blue-400 ${themeColors.transition}`}>
                      {item.coordinates.x}, {item.coordinates.y}, {item.coordinates.z}
                    </span>
                    <TargetIcon className={`w-4 h-4 ${themeColors.text.secondary} group-hover:text-blue-500 dark:group-hover:text-blue-400 ${themeColors.transition}`} />
                  </div>

                  {type === 'portal' && item.world === 'nether' && (item as Portal).address && (
                    <span className={`text-sm ${themeColors.infoOverlay.netherAddressText} ${themeColors.transition} ml-auto`}>
                      {(item as Portal).address}
                    </span>
                  )}
                </div>
                {(item as Portal)['nether-associate']?.address && (
                  <div className={`mt-2 pt-2 border-t ${themeColors.border.primary} ${themeColors.transition}`}>
                      <div className="flex items-center gap-2">
                          <span className={getWorldBadgeLarge('nether')}>
                          nether
                          </span>
                          <div className="flex items-center justify-between w-full">
                            <span className={`text-sm ${themeColors.text.tertiary} ${themeColors.transition}`}>
                              {(item as Portal)['nether-associate']?.coordinates.x}, {(item as Portal)['nether-associate']?.coordinates.y}, {(item as Portal)['nether-associate']?.coordinates.z}
                            </span>
                            <span className={`text-sm ${themeColors.text.tertiary} ${themeColors.transition}`}>
                              {(item as Portal)['nether-associate']?.address}
                            </span>
                          </div>
                      </div>
                          </div>
                  )}
              </div>
              
              {/* Owner skin rendering */}
              {type === 'place' && primaryOwner && (
                <div className="relative flex-shrink-0 mr-2">
                  <div
                    onMouseEnter={() => setShowOwnerTooltip(true)}
                    onMouseLeave={() => setShowOwnerTooltip(false)}
                  >
                    <img
                      key={`skin-${primaryOwner}`}
                      src={getRenderUrl(primaryOwner, {
                        renderType: 'head',
                        crop: 'full',
                        borderHighlight: true,
                        borderHighlightRadius: 7,
                        dropShadow: true,
                      })}
                      alt={`Skin de ${primaryOwner}`}
                      className="w-20 h-20 object-contain transition-transform duration-200 hover:scale-110"
                      style={{ imageRendering: 'pixelated' }}
                      crossOrigin="anonymous"
                      loading="eager"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Owner badge tooltip */}
                  {showOwnerTooltip && (
                    <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 -translate-y-full px-3 py-2 text-sm font-medium ${themeColors.util.roundedFull} ${themeColors.infoOverlay.placeTags} whitespace-nowrap z-[10000]`}>
                      <span className="opacity-75">Propriétaire : </span>
                      <span className="font-bold">
                        {additionalOwners.length
                          ? `${primaryOwner} (+${additionalOwners.length})`
                          : primaryOwner}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleClose}
                className={`ml-2 p-1 ${themeColors.util.roundedFull} ${themeColors.button.secondary} border ${themeColors.border.light} ${themeColors.shadow.button} transition-all duration-200 ${themeColors.util.hoverScale} ${themeColors.util.activeScale} flex-shrink-0 ${themeColors.interactive.hoverBorder}`}
                aria-label="Fermer"
              >
                <CrossIcon className={`w-4 h-4 ${themeColors.text.secondary}`} />
              </button>
            </div>
          </div>

          {/* Content - conditionally render Info or Trade content */}
          <div className="relative flex-1 min-h-0 rounded-b-xl overflow-hidden">
            {/* Sliding container for content */}
            <div className="relative w-full h-full">
              <div
                className="absolute inset-0 transition-transform duration-300 ease-in-out"
                style={{
                  transform: showTradeView ? 'translateX(-100%)' : 'translateX(0)',
                }}
              >
                {/* Info Content */}
                <div
                  ref={!showTradeView ? contentRef : undefined}
                  className={`h-full overflow-y-auto px-6 space-y-6 ${themeColors.panel.primary} ${themeColors.transition} ${type === 'place' && (item as Place).trade && (item as Place).trade!.length > 0 ? 'pt-[4.5rem] pb-12' : 'pt-9 pb-12 rounded-b-xl'}`}
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {/* Place Image */}
                  {placeItem?.image && (
                    <div className="flex justify-center">
                      <img
                        src={placeItem.image}
                        alt={`Image de ${item.name}`}
                        className={`h-72 w-auto max-w-full object-contain ${themeColors.util.roundedLg}`}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {renderDescription}

                  {/* Tags (only for places) */}
                  {renderTags}
                </div>
              </div>

              <div
                className="absolute inset-0 transition-transform duration-300 ease-in-out"
                style={{
                  transform: showTradeView ? 'translateX(0)' : 'translateX(100%)',
                }}
              >
                {/* Trade Content */}
                {type === 'place' && (item as Place).trade && (item as Place).trade!.length > 0 && (
                  <div
                    ref={showTradeView ? contentRef : undefined}
                    className={`h-full overflow-y-auto px-6 pt-[4.5rem] pb-12 ${themeColors.panel.primary} ${themeColors.transition} rounded-b-xl`}
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                  >
                    <TradeOverlay place={item as Place} contentOnly={true} searchQuery={tradeSearchQuery} onSearchChange={setTradeSearchQuery} />
                  </div>
                )}
              </div>
            </div>

            {/* Top gradient - always visible (30% solid, 70% fade to transparent) */}
            <div className={`absolute top-0 left-0 right-0 h-20 gradient-top-solid-blur z-10 pointer-events-none ${themeColors.transition}`} />

            {/* Toggle Informations/Commerce - positioned over content if place has trades */}
            {type === 'place' && (item as Place).trade && (item as Place).trade!.length > 0 && (
              <div className="absolute top-0 left-0 right-0 px-6 pt-4 pb-2 z-20">
                <div className="flex gap-2 items-center h-8">
                  <button
                    onClick={() => setShowTradeView(false)}
                    className={`px-3 py-1 text-sm rounded-full font-medium transition-colors duration-300 flex items-center gap-1.5 flex-shrink-0 ${
                      !showTradeView
                        ? 'bg-blue-100/50 dark:bg-blue-800/20 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100/30 dark:bg-gray-700/15 text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-600/20'
                    }`}
                  >
                    <InfoIcon className="w-4 h-4" />
                    Informations
                  </button>
                  <button
                    onClick={() => setShowTradeView(true)}
                    className={`px-3 py-1 text-sm rounded-full font-medium transition-colors duration-300 flex items-center gap-1.5 flex-shrink-0 ${
                      showTradeView
                        ? 'bg-blue-100/50 dark:bg-blue-800/20 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100/30 dark:bg-gray-700/15 text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-600/20'
                    }`}
                  >
                    <ShopIcon className="w-4 h-4" />
                    Commerce
                  </button>

                  {/* Search Bar - animated entrance */}
                  <div className={`relative flex-1 ml-2 transition-all duration-300 ease-in-out ${showTradeView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                    <input
                      type="text"
                      value={tradeSearchQuery}
                      onChange={(e) => setTradeSearchQuery(e.target.value)}
                      placeholder="Rechercher un produit, une monnaie..."
                      className={`w-full h-8 px-3 text-sm ${themeColors.input.search} border ${themeColors.util.roundedLg} focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder}`}
                      disabled={!showTradeView}
                    />
                    {tradeSearchQuery && showTradeView && (
                      <button
                        onClick={() => setTradeSearchQuery('')}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${themeColors.text.secondary} ${themeColors.interactive.hoverText} ${themeColors.transition}`}
                      >
                        <ClearIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom solid + blur gradient */}
            <div className={`absolute bottom-0 left-0 right-0 h-2 ${themeColors.gradient.bottomSolid} z-10 pointer-events-none ${themeColors.transition} ${showBottomBlur ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`absolute bottom-2 left-0 right-0 h-8 ${themeColors.gradient.bottomBlur} z-10 pointer-events-none ${themeColors.transition} ${showBottomBlur ? 'opacity-100' : 'opacity-0'}`} />
          </div>
        </div>
  );

  if (withinOverlay) {
    return panel;
  }

  return (
    <Overlay isOpen={isOpen} onClose={handleClose} closing={effectiveClosing}>
      {panel}
    </Overlay>
  );
}
