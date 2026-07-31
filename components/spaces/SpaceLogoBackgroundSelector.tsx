import CompactChoiceGroup from '@/components/form/common/CompactChoiceGroup';
import type { SpaceLogoBackground } from '@/lib/spaces/types';

interface SpaceLogoBackgroundSelectorProps {
  disabled?: boolean;
  onChange: (value: SpaceLogoBackground) => void;
  value: SpaceLogoBackground;
}

const options: Array<{
  label: string;
  value: SpaceLogoBackground;
}> = [
  { label: 'Transparent', value: 'transparent' },
  { label: 'Couleur', value: 'color' },
];

export default function SpaceLogoBackgroundSelector({
  disabled = false,
  onChange,
  value,
}: SpaceLogoBackgroundSelectorProps) {
  return (
    <CompactChoiceGroup
      ariaLabel="Fond du logo"
      className="justify-end"
      disabled={disabled}
      onChange={onChange}
      options={options}
      value={value}
    />
  );
}
