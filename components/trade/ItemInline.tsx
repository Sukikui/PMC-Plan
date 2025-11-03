'use client';

import React, { useEffect, useState } from 'react';
import { getItemInfo, MinecraftItemData } from '@/lib/minecraft-items';
import { themeColors } from '@/lib/theme-colors';
import { getItemBadgeLarge } from '@/lib/ui-utils';
import ItemVisualizer from './ItemVisualizer';

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

  useEffect(() => {
    let cancelled = false;
    async function fetchItem() {
      try {
        if (!item.item_id) {
          setItemData(null);
          return;
        }
        const data = await getItemInfo(item.item_id, 'fr_fr');
        if (!cancelled) setItemData(data);
      } catch {
        // ignore
      }
    }
    fetchItem();
    return () => { cancelled = true; };
  }, [item.item_id]);

  const name = item.custom_name || itemData?.name || item.item_id.replace(/^minecraft:/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="flex items-center gap-3 min-w-0">
      <ItemVisualizer itemId={item.item_id} enchanted={item.enchanted} className="w-8 h-8 flex-shrink-0" />
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-sm font-bold ${themeColors.text.primary} flex-shrink-0`}>{item.quantity}</span>
        <span className={`${getItemBadgeLarge(!!item.custom_name)} whitespace-normal break-words max-w-[18rem]`}>{name}</span>
      </div>
    </div>
  );
};

export default ItemInline;
