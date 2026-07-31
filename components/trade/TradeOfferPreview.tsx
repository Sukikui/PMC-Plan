import type { ReactNode } from 'react';
import { listRowClassName } from '@/components/ui/ListRow';
import ExpandableDescription from '@/components/ui/ExpandableDescription';
import { themeColors } from '@/lib/theme-colors';
import ItemInline from './ItemInline';

interface PreviewTradeItem {
  custom_name?: string | null;
  item_id: string;
  quantity: number | string;
  enchanted: boolean;
  lore?: string[];
}

export interface PreviewTradeOffer {
  gives: PreviewTradeItem;
  wants: PreviewTradeItem;
  negotiable?: boolean;
  description?: string | null;
}

interface TradeOfferPreviewProps {
  action?: ReactNode;
  compactItemText?: boolean;
  offer: PreviewTradeOffer;
  expandableDescription?: boolean;
  expanded?: boolean;
  leading?: ReactNode;
  onExpandedChange?: (expanded: boolean) => void;
  variant?: 'framed' | 'list' | 'plain';
}

export const tradeOfferFrameClass = `${themeColors.infoOverlay.descriptionBg} border ${themeColors.border.primary} ${themeColors.util.roundedLg} ${themeColors.transition}`;
export const tradeOfferListRowClass = `${listRowClassName} px-2`;
const tradeLayoutClassName = 'flex items-center gap-4';
const tradeExchangeBaseClassName = 'flex min-w-0 items-center gap-4';

export function TradeOfferPreview({
  action,
  compactItemText = false,
  offer,
  expandableDescription = false,
  expanded = false,
  leading,
  onExpandedChange,
  variant = 'framed',
}: TradeOfferPreviewProps) {
  const containerClass = getContainerClass(variant);
  const exchangeClassName = getTradeExchangeClassName(Boolean(leading));
  const content = (
    <div className={tradeLayoutClassName}>
      {leading}
      <div className={exchangeClassName}>
        <div className="min-w-0 flex-1">
          <TradeItemPreview compactText={compactItemText} item={offer.gives} />
        </div>

        <div className={`${themeColors.text.tertiary} mx-2 flex-shrink-0`}>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          {offer.negotiable
            ? <NegotiablePlaceholder compactText={compactItemText} />
            : <TradeItemPreview compactText={compactItemText} item={offer.wants} />}
        </div>
      </div>
    </div>
  );

  if (expandableDescription) {
    return (
      <ExpandableDescription
        className={containerClass}
        description={offer.description}
        expanded={expanded}
        onExpandedChange={onExpandedChange ?? (() => {})}
      >
        {content}
      </ExpandableDescription>
    );
  }

  if (action) {
    return (
      <div className={containerClass}>
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 flex-1">{content}</div>
          <div className="flex-shrink-0">{action}</div>
        </div>
      </div>
    );
  }

  return <div className={containerClass}>{content}</div>;
}

export function TradeOfferColumnsHeader({ leading }: { leading?: ReactNode }) {
  return (
    <div className={`${tradeLayoutClassName} pb-2 pl-2 pr-9`}>
      {leading}
      <div className={getTradeExchangeClassName(Boolean(leading))}>
        <TradeOfferColumnHeader className="min-w-0 flex-1 text-center">
          Propose
        </TradeOfferColumnHeader>
        <div className="mx-2 w-6 flex-shrink-0" />
        <TradeOfferColumnHeader className="min-w-0 flex-1 text-center">
          Demande
        </TradeOfferColumnHeader>
      </div>
    </div>
  );
}

function getTradeExchangeClassName(hasLeading: boolean) {
  return `${tradeExchangeBaseClassName} ${hasLeading ? 'flex-[3]' : 'flex-1'}`;
}

export function TradeOfferColumnHeader({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`${className} truncate text-xs font-semibold ${themeColors.text.secondary} ${themeColors.util.uppercase}`}>
      {children}
    </span>
  );
}

function getContainerClass(variant: NonNullable<TradeOfferPreviewProps['variant']>) {
  if (variant === 'list') return tradeOfferListRowClass;
  if (variant === 'framed') return `${tradeOfferFrameClass} p-4`;
  return '';
}

function NegotiablePlaceholder({ compactText }: { compactText: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3 pl-2">
      <span className={`${compactText ? 'text-[13px]' : 'text-sm'} font-semibold ${themeColors.text.primary}`}>Sur demande</span>
    </div>
  );
}

function TradeItemPreview({
  compactText,
  item,
}: {
  compactText: boolean;
  item: PreviewTradeItem;
}) {
  return (
    <div className="space-y-2">
      <ItemInline compactText={compactText} item={item} />
      {item.lore && item.lore.length > 0 && (
        <div className={`space-y-1 pl-11 text-xs ${themeColors.text.quaternary}`}>
          {item.lore.map((line, index) => (
            <div key={index} className="italic">&quot;{line}&quot;</div>
          ))}
        </div>
      )}
    </div>
  );
}
