import { CONTENT_FIELD_LIMITS } from '@/lib/content/constraints';
import FormField from './FormField';
import { formInputClassName } from './form-styles';

interface DiscordUrlFieldProps {
  disabled?: boolean;
  label?: string;
  onChange: (value: string) => void;
  optional?: boolean;
  value: string;
}

export default function DiscordUrlField({
  disabled = false,
  label = 'Lien Discord',
  onChange,
  optional = true,
  value,
}: DiscordUrlFieldProps) {
  return (
    <FormField label={`${label}${optional ? ' (optionnel)' : ''}`}>
      <input
        autoComplete="off"
        className={formInputClassName}
        disabled={disabled}
        inputMode="url"
        maxLength={CONTENT_FIELD_LIMITS.discordUrl}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://discord.gg/votre-serveur"
        type="url"
        value={value}
      />
    </FormField>
  );
}
