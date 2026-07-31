'use client';

import React, { useEffect, useState } from 'react';
import { getItemInfo, MinecraftItemData } from '@/lib/minecraft/items';
import { themeColors } from '@/lib/theme-colors';
import { getItemBadgeLarge } from '@/lib/ui-utils';
import ItemVisualizer from './ItemVisualizer';

interface InlineItemProps {
  compactText?: boolean;
  item: {
    custom_name?: string | null;
    item_id: string;
    quantity: number | string;
    enchanted: boolean;
    lore?: string[];
  };
}

const ItemInline: React.FC<InlineItemProps> = ({
  compactText = false,
  item,
}) => {
  const [itemData, setItemData] = useState<MinecraftItemData | null>(null);

  useEffect(() => {
    setItemData(null);
    if (!item.item_id) return;

    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        const data = await getItemInfo(item.item_id, 'fr_fr');
        if (!cancelled) setItemData(data);
      } catch {
        // ignore
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [item.item_id]);

  const name = item.custom_name
    || itemData?.name
    || item.item_id.replace(/^minecraft:/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    || 'Objet non renseigné';
  const quantity = String(item.quantity).trim() || '—';

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="relative h-8 w-8 flex-shrink-0">
        <ItemVisualizer itemId={item.item_id} enchanted={item.enchanted} className="h-8 w-8" />
        <span className={`pointer-events-none absolute -bottom-0.5 -right-0.5 z-[1] text-sm font-bold leading-none tabular-nums ${themeColors.trade.itemQuantity}`}>
          {quantity}
        </span>
      </div>
      <span className={`${getItemBadgeLarge(!!item.custom_name, compactText)} max-w-[18rem] whitespace-normal break-words`}>{name}</span>
    </div>
  );
};

export default ItemInline;
