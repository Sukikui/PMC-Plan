import { themeColors } from '@/lib/theme-colors';
import {
  getMapIconSrc,
  placeCategoryOptions,
  type PlaceCategory,
} from '@/lib/place/categories';

interface PlaceCategorySelectorProps {
  value: PlaceCategory;
  onChange: (category: PlaceCategory) => void;
}

export default function PlaceCategorySelector({ value, onChange }: PlaceCategorySelectorProps) {
  return (
    <div className="space-y-2">
      <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Catégorie</label>
      <div className="grid gap-2 md:grid-cols-2">
        {placeCategoryOptions.map((category) => (
          <button
            key={category.value}
            type="button"
            aria-pressed={value === category.value}
            onClick={() => onChange(category.value)}
            className={`flex items-center gap-3 text-left border px-3 py-2 ${themeColors.util.roundedLg} ${themeColors.transitionAll} ${
              value === category.value
                ? themeColors.form.categoryOption.active
                : themeColors.form.categoryOption.inactive
            }`}
          >
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center border ${themeColors.util.roundedLg} ${themeColors.transitionAll} ${
              value === category.value
                ? themeColors.form.categoryOption.iconActive
                : themeColors.form.categoryOption.iconInactive
            }`}>
              <img src={getMapIconSrc(category.value)} alt="" aria-hidden="true" className="h-8 w-8 object-contain" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{category.label}</span>
              <span className="block text-xs opacity-75">{category.description}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

