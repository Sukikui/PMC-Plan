import type { Place, Portal } from '@/app/api/utils/shared';
import { themeColors } from '@/lib/theme-colors';

interface InfoOverlayDetailsProps {
  item: Place | Portal;
  type: 'place' | 'portal';
}

export default function InfoOverlayDetails({ item, type }: InfoOverlayDetailsProps) {
  return (
    <>
      {item.description && item.description.length > 0 && (
        <div>
          <h3 className={`text-lg font-semibold ${themeColors.text.primary} mb-3 ${themeColors.transition}`}>Description</h3>
          <p className={`${themeColors.text.quaternary} leading-relaxed ${themeColors.infoOverlay.descriptionBg} p-4 ${themeColors.util.roundedLg} ${themeColors.transition}`}>
            {item.description}
          </p>
        </div>
      )}

      {type === 'place' && Array.isArray((item as Place).tags) && (item as Place).tags.length > 0 && (
        <div>
          <h3 className={`text-lg font-semibold ${themeColors.text.primary} mb-3 ${themeColors.transition}`}>Tags</h3>
          <div className="flex flex-wrap gap-2">
            {(item as Place).tags.map((tag) => (
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

