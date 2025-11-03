'use client';

import React, { useState, useEffect } from 'react';
import { getItemInfo, getTextures } from '@/lib/minecraft-items';
import EnchantedImage from './EnchantedImage';
import { themeColors } from '@/lib/theme-colors';

interface ItemVisualizerProps {
  itemId: string;
  enchanted?: boolean;
  className?: string;
}

const ItemVisualizer: React.FC<ItemVisualizerProps> = ({ itemId, enchanted, className }) => {
  const [texture, setTexture] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) {
      setTexture(null);
      return;
    }

    let isCancelled = false;

    const fetchItemTexture = async () => {
      setLoading(true);
      setError(null);
      try {
        const itemInfo = await getItemInfo(itemId);
        if (!isCancelled) {
          const textures = getTextures(itemInfo);
          if (textures.length > 0) {
            setTexture(textures[0]);
          } else {
            setTexture(null);
            setError('No texture found');
          }
        }
      } catch (e) {
        if (!isCancelled) {
          setTexture(null);
          setError('Invalid item ID');
        }
      }
      setLoading(false);
    };

    const debounceTimeout = setTimeout(fetchItemTexture, 300);

    return () => {
      isCancelled = true;
      clearTimeout(debounceTimeout);
    };
  }, [itemId]);

  if (loading) {
    return <div className={`${className} flex items-center justify-center`}><div className={`w-6 h-6 ${themeColors.text.secondary} border-2 border-current border-t-transparent rounded-full animate-spin`} /></div>;
  }

  if (error || !texture) {
    return <div className={`${className} ${themeColors.infoOverlay.descriptionBg} ${themeColors.util.roundedLg} flex items-center justify-center`}><span className={`text-xs ${themeColors.text.quaternary}`}>?</span></div>;
  }

  return <EnchantedImage src={texture} alt={itemId} enchanted={enchanted} className={className} onError={() => setError('Failed to load texture')} />;
};

export default ItemVisualizer;
