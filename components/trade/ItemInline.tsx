"use client";

import React, { useEffect, useState } from 'react';
import { getItemInfo, getTextures, MinecraftItemData } from '@/lib/minecraft-items';
import { themeColors } from '@/lib/theme-colors';
import { getItemBadgeLarge } from '@/lib/ui-utils';
import EnchantedImage from './EnchantedImage';

interface InlineItemProps {
  item: {
    custom_name?: string | null;
    item_id: string;
    quantity: number;
    enchanted: boolean;
    lore?: string[];
  };
}

const ItemInline: React.FC<InlineItemProps> = ({ item }) => {
  const [itemData, setItemData] = useState<MinecraftItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchItem() {
      try {
        setLoading(true);
        setError(false);
        if (!item.item_id) {
          setItemData(null);
          return;
        }
        const data = await getItemInfo(item.item_id, 'fr_fr');
        if (!cancelled) setItemData(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchItem();
    return () => { cancelled = true; };
  }, [item.item_id]);

  const name = item.custom_name || itemData?.name || item.item_id.replace(/^minecraft:/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const textures = itemData ? getTextures(itemData) : [];
  const texture = textures[0];

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
        {loading ? (
          <div className={`w-6 h-6 ${themeColors.text.secondary} border-2 border-current border-t-transparent rounded-full animate-spin`} />
        ) : error || !texture ? (
          <div className={`w-8 h-8 ${themeColors.infoOverlay.descriptionBg} ${themeColors.util.roundedLg} flex items-center justify-center`}>
            <span className={`text-xs ${themeColors.text.quaternary}`}>?</span>
          </div>
        ) : (
          <EnchantedImage
            src={texture}
            alt={name}
            enchanted={item.enchanted}
            onError={() => setError(true)}
          />
        )}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-sm font-bold ${themeColors.text.primary} flex-shrink-0`}>{item.quantity}</span>
        <span className={`${getItemBadgeLarge(!!item.custom_name)} whitespace-normal break-words max-w-[18rem]`}>{name}</span>
      </div>
    </div>
  );
};

export default ItemInline;
