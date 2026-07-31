import ShopIcon from '@/components/icons/ShopIcon';
import WrenchIcon from '@/components/icons/WrenchIcon';
import ItemVisualizer from '@/components/trade/ItemVisualizer';
import { themeColors } from '@/lib/theme-colors';

interface ServiceIllustrationProps {
  className?: string;
  itemId?: string | null;
}

interface ServiceItemVisualProps extends ServiceIllustrationProps {
  fallback: 'illustration' | 'payment';
}

export function ServiceItemVisual({
  className = 'h-10 w-10',
  fallback,
  itemId,
}: ServiceItemVisualProps) {
  if (itemId) {
    return (
      <ItemVisualizer
        className={`${className} shrink-0 object-contain`}
        itemId={itemId}
      />
    );
  }

  const FallbackIcon = fallback === 'payment' ? ShopIcon : WrenchIcon;
  return (
    <span className={`${className} flex shrink-0 items-center justify-center ${themeColors.util.roundedLg} ${themeColors.infoOverlay.descriptionBg} ${themeColors.text.secondary}`}>
      <FallbackIcon className="h-1/2 w-1/2" />
    </span>
  );
}

export default function ServiceIllustration(props: ServiceIllustrationProps) {
  return <ServiceItemVisual {...props} fallback="illustration" />;
}
