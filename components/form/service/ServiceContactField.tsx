import CompactChoiceGroup from '@/components/form/common/CompactChoiceGroup';
import DiscordUrlField from '@/components/form/common/DiscordUrlField';
import { ExpandableSection } from '@/components/ui/ExpandableSection';
import type { ServiceContactType } from '@/lib/services/types';

const contactOptions = [
  { label: 'Aucun', value: 'none' },
  { label: 'Gestionnaire principal', value: 'primary_manager' },
  { label: 'Personnalisé', value: 'custom' },
] as const;

interface ServiceContactFieldProps {
  customUrl: string;
  disabled?: boolean;
  onCustomUrlChange: (value: string) => void;
  onTypeChange: (value: ServiceContactType) => void;
  type: ServiceContactType;
}

export default function ServiceContactField({
  customUrl,
  disabled = false,
  onCustomUrlChange,
  onTypeChange,
  type,
}: ServiceContactFieldProps) {
  return (
    <div className="space-y-2">
      <CompactChoiceGroup
        ariaLabel="Type de contact"
        disabled={disabled}
        onChange={onTypeChange}
        options={contactOptions}
        value={type}
      />
      <ExpandableSection expanded={type === 'custom'}>
        <div className="pt-2">
          <DiscordUrlField
            disabled={disabled}
            label="Lien Discord personnalisé"
            onChange={onCustomUrlChange}
            optional={false}
            value={customUrl}
          />
        </div>
      </ExpandableSection>
    </div>
  );
}
