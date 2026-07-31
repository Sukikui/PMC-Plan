import FormField from '@/components/form/common/FormField';
import { minecraftItemIdPlaceholder } from '@/components/form/common/form-placeholders';
import { formInputClassName } from '@/components/form/common/form-styles';
import { ServiceItemVisual } from '@/components/services/ServiceIllustration';
import { SERVICE_ITEM_ID_MAX_LENGTH } from '@/lib/services/schemas';

interface ServiceItemFieldProps {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholderItem: string;
  value: string;
  variant: 'illustration' | 'payment';
}

export default function ServiceItemField({
  disabled = false,
  label,
  onChange,
  placeholderItem,
  value,
  variant,
}: ServiceItemFieldProps) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
      <ServiceItemVisual
        className="h-14 w-14"
        fallback={variant}
        itemId={value.trim() || null}
      />
      <FormField label={label}>
        <input
          autoComplete="off"
          className={formInputClassName}
          disabled={disabled}
          maxLength={SERVICE_ITEM_ID_MAX_LENGTH}
          onChange={(event) => onChange(event.target.value)}
          placeholder={minecraftItemIdPlaceholder(placeholderItem)}
          value={value}
        />
      </FormField>
    </div>
  );
}
