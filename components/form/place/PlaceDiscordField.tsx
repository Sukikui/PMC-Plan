import DiscordUrlField from '@/components/form/common/DiscordUrlField';
import CompactChoiceGroup from '@/components/form/common/CompactChoiceGroup';
import type { SpaceReference } from '@/lib/spaces/types';

interface PlaceDiscordFieldProps {
  disabled?: boolean;
  onModeChange: (overrideEnabled: boolean) => void;
  onValueChange: (value: string) => void;
  overrideEnabled: boolean;
  space: SpaceReference | null;
  value: string;
}

export default function PlaceDiscordField({
  disabled = false,
  onModeChange,
  onValueChange,
  overrideEnabled,
  space,
  value,
}: PlaceDiscordFieldProps) {
  const inheritedUrl = space?.discordUrl ?? null;
  const usesInheritedUrl = Boolean(inheritedUrl) && !overrideEnabled;

  return (
    <div className="space-y-2">
      <DiscordUrlField
        disabled={disabled || usesInheritedUrl}
        onChange={onValueChange}
        value={usesInheritedUrl ? inheritedUrl! : value}
      />
      {inheritedUrl && (
        <div className="flex justify-end">
          <CompactChoiceGroup
            ariaLabel="Origine du lien Discord"
            disabled={disabled}
            onChange={(value) => onModeChange(value === 'custom')}
            options={[
              { label: space?.name ?? 'Espace', value: 'space' },
              { label: 'Personnalisé', value: 'custom' },
            ]}
            value={overrideEnabled ? 'custom' : 'space'}
          />
        </div>
      )}
    </div>
  );
}
