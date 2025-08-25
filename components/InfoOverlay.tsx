'use client';

import { useEffect } from 'react';

interface Place {
  id: string;
  name: string;
  tags: string[];
  world: 'overworld' | 'nether';
  coordinates: { x: number; y: number; z: number };
  description?: string;
  owner?: string;
}

interface Portal {
  id: string;
  name: string;
  world: 'overworld' | 'nether';
  coordinates: { x: number; y: number; z: number };
  description?: string;
  owner?: string;
  'nether-associate'?: {
    id: string;
    coordinates: { x: number; y: number; z: number };
    address: string;
  };
}

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

  const getWorldBadge = (world: string) => {
    const baseClasses = "inline-block text-sm px-3 py-1 rounded-full font-medium transition-colors duration-300";
    if (world === 'overworld') {
      return `${baseClasses} bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300`;
    } else if (world === 'nether') {
      return `${baseClasses} bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300`;
    }
    return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300`;
  };

  const getTypeStyles = () => {
    if (type === 'place') {
      return {
        border: 'border-blue-200 dark:border-blue-700',
        headerBg: 'bg-white/90 dark:bg-gray-900/95',
        headerBorder: 'border-gray-200/50 dark:border-gray-600/50'
      };
    } else {
      return {
        border: 'border-purple-200 dark:border-purple-700',
        headerBg: 'bg-white/90 dark:bg-gray-900/95',
        headerBorder: 'border-gray-200/50 dark:border-gray-600/50'
      };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black/0 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 cursor-pointer"
        onClick={onClose}
        aria-label="Fermer l'overlay"
      />
      
      <div className={`relative bg-white/90 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border-2 ${typeStyles.border} transition-colors duration-300`}>
        {/* Header */}
        <div className={`p-6 border-b ${typeStyles.headerBorder} ${typeStyles.headerBg} transition-colors duration-300`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">{item.name}</h2>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full uppercase transition-colors duration-300">
                  {type === 'place' ? 'Lieu' : 'Portail'}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={getWorldBadge(item.world)}>
                  {item.world}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                  {item.coordinates.x}, {item.coordinates.y}, {item.coordinates.z}
                </span>
              </div>
              {'nether-associate' in item && item['nether-associate'] && (
                <div className="mt-2 pt-2 border-t border-gray-200/80 dark:border-gray-600/50 transition-colors duration-300">
                    <div className="flex items-center gap-2">
                        <span className={getWorldBadge('nether')}>
                        nether
                        </span>
                        <div className="flex items-center justify-between w-full">
                            <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                                {item['nether-associate'].coordinates.x}, {item['nether-associate'].coordinates.y}, {item['nether-associate'].coordinates.z}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                                {item['nether-associate'].address}
                            </span>
                        </div>
                    </div>
                </div>
                )}
            </div>
            
            <button
              onClick={onClose}
              className="ml-2 p-1 rounded-full bg-white dark:bg-gray-800 hover:bg-white/90 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 border border-gray-200 dark:border-gray-600 shadow-sm transition-all duration-200 flex-shrink-0"
              aria-label="Fermer"
            >
              <span className="w-4 h-4 flex items-center justify-center text-gray-400 dark:text-gray-300 text-sm transition-colors duration-300">
                ×
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-white/90 dark:bg-gray-900/95 transition-colors duration-300">
          {/* Place Image */}
          {type === 'place' && (
            <div className="flex justify-center">
              <img
                src={`/data/place_images/${item.id}.png`}
                alt={`Image de ${item.name}`}
                className="max-h-64 w-auto rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Description */}
          {item.description && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">Description</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg transition-colors duration-300">
                {item.description}
              </p>
            </div>
          )}

          {/* Owner/Manager */}
          {item.owner && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">Propriétaire / Gérant</h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg transition-colors duration-300">
                <span className="text-gray-800 dark:text-gray-200 font-medium transition-colors duration-300">{item.owner}</span>
              </div>
            </div>
          )}

          {/* Tags (only for places) */}
          {'tags' in item && item.tags && item.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {item.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 text-sm px-3 py-1 rounded-full font-medium transition-colors duration-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
