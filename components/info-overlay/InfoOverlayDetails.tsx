import type { Place, Portal } from '@/lib/api/types';
import { themeColors } from '@/lib/theme-colors';
import InfoDescriptionSection from './InfoDescriptionSection';
import MapEntryOwners from './MapEntryOwners';

interface InfoOverlayDetailsProps {
  item: Place | Portal;
  type: 'place' | 'portal';
}

export default function InfoOverlayDetails({ item, type }: InfoOverlayDetailsProps) {
  const place = type === 'place' ? item as Place : null;

  return (
    <>
      <MapEntryOwners owners={item.owners} />

      <InfoDescriptionSection description={item.description} />

      {place && Array.isArray(place.tags) && place.tags.length > 0 && (
        <div>
          <h3 className={`text-lg font-semibold ${themeColors.text.primary} mb-3 ${themeColors.transition}`}>Tags</h3>
          <div className="flex flex-wrap gap-2">
            {place.tags.map((tag) => (
              <span
                key={tag}
                className={`${themeColors.infoOverlay.placeTags} text-sm px-3 py-1 ${themeColors.util.roundedFull} font-medium ${themeColors.transition}`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
