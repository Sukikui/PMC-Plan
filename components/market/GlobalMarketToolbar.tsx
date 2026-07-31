import PillTabs from '@/components/ui/PillTabs';
import OverlaySearchInput from '@/components/ui/OverlaySearchInput';

export type GlobalMarketTab = 'offers' | 'services';

const marketTabs = [
  { value: 'offers', label: 'Offres' },
  { value: 'services', label: 'Services' },
] as const;

interface GlobalMarketToolbarProps {
  activeTab: GlobalMarketTab;
  onQueryChange: (query: string) => void;
  onTabChange: (tab: GlobalMarketTab) => void;
  query: string;
}

export default function GlobalMarketToolbar({
  activeTab,
  onQueryChange,
  onTabChange,
  query,
}: GlobalMarketToolbarProps) {
  return (
    <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-3 px-8 pb-2 pt-4">
      <PillTabs
        activeValue={activeTab}
        onChange={onTabChange}
        options={marketTabs}
      />
      <OverlaySearchInput
        ariaLabel="Rechercher dans la place de marché"
        onChange={onQueryChange}
        placeholder="Rechercher un service, un produit, un lieu ou un prestataire..."
        value={query}
      />
    </div>
  );
}
