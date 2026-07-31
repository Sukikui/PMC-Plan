import type { ReactNode } from 'react';
import { CONTENT_FIELD_LIMITS } from '@/lib/content/constraints';
import FormField from './FormField';
import { formInputClassName, formTextareaClassName } from './form-styles';
import type { EntityFormController } from './useEntityForm';

interface CommonFieldsProps {
  afterName?: ReactNode;
  afterSlug?: ReactNode;
  descriptionOptional?: boolean;
  descriptionPlaceholder: string;
  disabled?: boolean;
  form: EntityFormController;
  nameLabel?: string;
  namePlaceholder: string;
  slugPlaceholder: string;
}

export default function CommonFields({
  afterName,
  afterSlug,
  descriptionOptional = true,
  descriptionPlaceholder,
  disabled = false,
  form,
  nameLabel = 'Nom',
  namePlaceholder,
  slugPlaceholder,
}: CommonFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        counter={{ current: form.name.length, max: CONTENT_FIELD_LIMITS.name }}
        label={nameLabel}
      >
        <input
          className={formInputClassName}
          disabled={disabled}
          maxLength={CONTENT_FIELD_LIMITS.name}
          value={form.name}
          onChange={(event) => form.setName(event.target.value)}
          placeholder={namePlaceholder}
        />
      </FormField>

      {afterName}

      <FormField
        counter={{
          current: (form.slugManuallyEdited ? form.slug : form.input.slug).length,
          max: CONTENT_FIELD_LIMITS.slug,
        }}
        label="Identifiant (slug)"
      >
        <input
          className={formInputClassName}
          disabled={disabled}
          maxLength={CONTENT_FIELD_LIMITS.slug}
          value={form.slugManuallyEdited ? form.slug : form.input.slug}
          onChange={(event) => {
            form.setSlug(event.target.value);
            form.setSlugManuallyEdited(true);
          }}
          placeholder={slugPlaceholder}
        />
      </FormField>

      {afterSlug}

      <FormField
        counter={{
          current: form.description.length,
          max: CONTENT_FIELD_LIMITS.description,
        }}
        label={`Description${descriptionOptional ? ' (optionnel)' : ''}`}
      >
        <textarea
          className={`${formTextareaClassName} min-h-[80px] resize-y`}
          disabled={disabled}
          maxLength={CONTENT_FIELD_LIMITS.description}
          value={form.description}
          onChange={(event) => form.setDescription(event.target.value)}
          placeholder={descriptionPlaceholder}
        />
      </FormField>

    </div>
  );
}
