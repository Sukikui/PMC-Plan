'use client';

import { useEffect } from 'react';
import CrossIcon from './icons/CrossIcon';

import { Place, Portal } from '../app/api/utils/shared';
import { getWorldBadgeLarge } from '../lib/ui-utils';
import { themeColors } from '../lib/theme-colors';
import { getRenderUrl } from '../lib/starlight-skin-api';

interface InfoOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  item: Place | Portal | null;
  type: 'place' | 'portal';
}

export default function InfoOverlay({ isOpen, onClose, item, type }: InfoOverlayProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
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
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

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

  return (
    <div className={`fixed inset-0 ${themeColors.ui.overlayBackdrop} ${themeColors.blurSm} z-[9999] flex items-center justify-center p-4`}>
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={onClose}
        aria-label="Fermer l'overlay"
      />
      
      <div className="flex items-start gap-4">
        <div className={`relative ${themeColors.panel.primary} ${themeColors.blur} ${themeColors.util.roundedXl} [box-shadow:0_0_25px_0_var(--tw-shadow-color)] ${typeStyles.shadow} max-w-2xl w-full max-h-[80vh] overflow-y-auto border ${typeStyles.border} ${themeColors.transition}`}>
          {/* Header */}
          <div className={`p-6 border-b ${typeStyles.headerBorder} ${typeStyles.headerBg} ${themeColors.transition}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className={`text-2xl font-bold ${themeColors.text.primary} ${themeColors.transition}`}>{item.name}</h2>
                  <span className={`text-sm font-medium ${themeColors.text.tertiary} ${themeColors.tag.display} px-2 py-1 ${themeColors.util.roundedFull} ${themeColors.util.uppercase} ${themeColors.transition}`}>
                    {type === 'place' ? 'Lieu' : 'Portail'}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={getWorldBadgeLarge(item.world)}>
                    {item.world}
                  </span>
                  <span className={`text-sm ${themeColors.text.tertiary} ${themeColors.transition}`}>
                    {item.coordinates.x}, {item.coordinates.y}, {item.coordinates.z}
                  </span>
                  {type === 'portal' && item.world === 'nether' && (item as Portal).address && (
                    <span className={`text-sm ${themeColors.infoOverlay.netherAddressText} ${themeColors.transition} ml-auto`}>
                      {(item as Portal).address}
                    </span>
                  )}
                </div>
                {'nether-associate' in item && item['nether-associate'] && item['nether-associate'].address && (
                  <div className={`mt-2 pt-2 border-t ${themeColors.border.primary} ${themeColors.transition}`}>
                      <div className="flex items-center gap-2">
                          <span className={getWorldBadgeLarge('nether')}>
                          nether
                          </span>
                          <div className="flex items-center justify-between w-full">
                              <span className={`text-sm ${themeColors.text.tertiary} ${themeColors.transition}`}>
                                  {item['nether-associate'].coordinates.x}, {item['nether-associate'].coordinates.y}, {item['nether-associate'].coordinates.z}
                              </span>
                              <span className={`text-sm ${themeColors.text.tertiary} ${themeColors.transition}`}>
                                  {item['nether-associate'].address}
                              </span>
                          </div>
                      </div>
                  </div>
                  )}
              </div>
              
              <button
                onClick={onClose}
                className={`ml-2 p-1 ${themeColors.util.roundedFull} ${themeColors.button.secondary} border ${themeColors.border.light} ${themeColors.shadow.button} transition-all duration-200 flex-shrink-0 ${themeColors.interactive.hoverBorder}`}
                aria-label="Fermer"
              >
                <CrossIcon className={`w-4 h-4 ${themeColors.text.secondary}`} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className={`p-6 space-y-6 ${themeColors.panel.primary} ${themeColors.transition}`}>
            {/* Place Image */}
            {type === 'place' && (
              <div className="flex justify-center">
                <img
                  src={`/data/place_images/${item.id}.png`}
                  alt={`Image de ${item.name}`}
                  className={`max-h-64 w-auto ${themeColors.util.roundedLg}`}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {renderDescription}

            {/* Tags (only for places) */}
            {renderTags} {/* Reintroduce renderDescription */}
          </div>
        </div>
        
        {type === 'place' && (item as Place).owner && (
          <div className="w-32 h-auto flex-shrink-0">
            <img
              src={getRenderUrl((item as Place).owner!, {
                renderType: 'mojavatar',
                crop: 'full',
                borderHighlight: true,
                borderHighlightRadius: 7,
                dropShadow: true,
              })}
              alt={'Skin du propriétaire'}
              className="w-full h-full object-contain"
              style={{ imageRendering: 'pixelated' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}