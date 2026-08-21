import RangeSlider, {
  type RangeSliderProps,
} from '@/components/ui/RangeSlider';
import { themeColors } from '@/lib/theme-colors';

type LabeledRangeFieldProps = Omit<
  RangeSliderProps,
  'ariaLabel' | 'className'
> & {
  label: string;
};

export const rangeFieldSectionClassName =
  'grid gap-5 md:grid-cols-[minmax(0,1fr)_11rem] md:items-end';

export default function LabeledRangeField({
  label,
  ...sliderProps
}: LabeledRangeFieldProps) {
  return (
    <label className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-center gap-3">
      <span className={`text-xs font-medium ${themeColors.text.secondary}`}>
        {label}
      </span>
      <RangeSlider
        {...sliderProps}
        ariaLabel={label}
        className="w-full md:w-[calc(100%_-_1rem)]"
      />
    </label>
  );
}
