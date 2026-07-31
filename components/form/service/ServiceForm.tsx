'use client';

import { useState } from 'react';
import CommonFields from '@/components/form/common/CommonFields';
import FormActions from '@/components/form/common/FormActions';
import FormField from '@/components/form/common/FormField';
import FormSection from '@/components/form/common/FormSection';
import { formInputClassName } from '@/components/form/common/form-styles';
import { useEntityForm } from '@/components/form/common/useEntityForm';
import { useFormSubmission } from '@/components/form/common/useFormSubmission';
import MapEntryManagementFields from '@/components/form/management/MapEntryManagementFields';
import { CONTENT_FIELD_LIMITS } from '@/lib/content/constraints';
import {
  emptyMapEntryDraft,
  getMapEntryDraftSnapshot,
  toMapEntryCreationPayload,
  toMapEntryUpdatePayload,
} from '@/lib/map-entry/types';
import type {
  Service,
  ServiceContactType,
  ServiceInput,
} from '@/lib/services/types';
import { discordUrlSchema } from '@/lib/validation/discord-url';
import ServiceContactField from './ServiceContactField';
import ServiceItemField from './ServiceItemField';

export interface InitialServiceData extends Service {
  canDelete?: boolean;
  type: 'service';
}

interface ServiceFormProps {
  initialData?: InitialServiceData;
  mode: 'add' | 'edit';
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  onSubmit: (input: ServiceInput) => Promise<void>;
}

export default function ServiceForm({
  initialData,
  mode,
  onCancel,
  onDelete,
  onSubmit,
}: ServiceFormProps) {
  const fields = useEntityForm(
    initialData?.name,
    initialData?.slug,
    initialData?.description,
  );
  const [subtitle, setSubtitle] = useState(initialData?.subtitle ?? '');
  const [contactType, setContactType] = useState<ServiceContactType>(
    initialData?.contactType ?? 'none',
  );
  const [contactDiscordUrl, setContactDiscordUrl] = useState(
    initialData?.contactDiscordUrl ?? '',
  );
  const [illustrationItemId, setIllustrationItemId] = useState(
    initialData?.illustrationItemId ?? '',
  );
  const [paymentItemId, setPaymentItemId] = useState(
    initialData?.paymentItemId ?? '',
  );
  const [paymentDescription, setPaymentDescription] = useState(
    initialData?.paymentDescription ?? '',
  );
  const [managementDraft, setManagementDraft] = useState(emptyMapEntryDraft);
  const [managementReady, setManagementReady] = useState(mode === 'add');
  const input: ServiceInput = {
    name: fields.input.name,
    subtitle: subtitle.trim(),
    slug: fields.input.slug,
    description: fields.input.description.trim(),
    contactType,
    contactDiscordUrl: contactType === 'custom'
      ? contactDiscordUrl.trim() || null
      : null,
    illustrationItemId: illustrationItemId.trim() || null,
    paymentItemId: paymentItemId.trim() || null,
    paymentDescription: paymentDescription.trim() || null,
    management: mode === 'add'
      ? toMapEntryCreationPayload(managementDraft)
      : managementReady
        ? toMapEntryUpdatePayload(managementDraft)
        : undefined,
  };
  const contactIsValid = contactType !== 'custom'
    || discordUrlSchema.safeParse(input.contactDiscordUrl).success;
  const submission = useFormSubmission({
    isReady: managementReady,
    isValid: fields.isValid
      && input.subtitle.length > 0
      && input.description.length > 0
      && contactIsValid,
    mode,
    snapshot: {
      ...input,
      management: getMapEntryDraftSnapshot(managementDraft),
    },
  });

  const save = async (event: React.FormEvent) => {
    await submission.submit(event, () => onSubmit(input));
  };

  const remove = async () => {
    if (onDelete) await submission.execute(onDelete);
  };

  return (
    <form className="space-y-5" onSubmit={save}>
      <FormSection title="Informations générales">
        <CommonFields
          afterSlug={(
            <>
              <ServiceItemField
                disabled={submission.isSubmitting}
                label="Item d’illustration (optionnel)"
                onChange={setIllustrationItemId}
                placeholderItem="repeater"
                value={illustrationItemId}
                variant="illustration"
              />
              <FormField
                counter={{
                  current: subtitle.length,
                  max: CONTENT_FIELD_LIMITS.shortText,
                }}
                label="Intitulé"
              >
                <input
                  className={formInputClassName}
                  disabled={submission.isSubmitting}
                  maxLength={CONTENT_FIELD_LIMITS.shortText}
                  onChange={(event) => setSubtitle(event.target.value)}
                  placeholder="Création de système redstone"
                  value={subtitle}
                />
              </FormField>
            </>
          )}
          descriptionOptional={false}
          descriptionPlaceholder="Présentez le service proposé, son fonctionnement et les modalités de prise de contact."
          disabled={submission.isSubmitting}
          form={fields}
          namePlaceholder="SukSukRedstone"
          slugPlaceholder="suksukredstone"
        />
      </FormSection>

      <FormSection title="Modalités de paiement">
        <ServiceItemField
          disabled={submission.isSubmitting}
          label="Item de paiement (optionnel)"
          onChange={setPaymentItemId}
          placeholderItem="emerald"
          value={paymentItemId}
          variant="payment"
        />
        <FormField
          counter={{
            current: paymentDescription.length,
            max: CONTENT_FIELD_LIMITS.shortText,
          }}
          label="Modalités (optionnel)"
        >
          <input
            className={formInputClassName}
            disabled={submission.isSubmitting}
            maxLength={CONTENT_FIELD_LIMITS.shortText}
            onChange={(event) => setPaymentDescription(event.target.value)}
            placeholder="Tarif selon la complexité du projet"
            value={paymentDescription}
          />
        </FormField>
      </FormSection>

      <FormSection title="Contact">
        <ServiceContactField
          customUrl={contactDiscordUrl}
          disabled={submission.isSubmitting}
          onCustomUrlChange={setContactDiscordUrl}
          onTypeChange={setContactType}
          type={contactType}
        />
      </FormSection>

      <FormSection title="Gestion">
        <MapEntryManagementFields
          disabled={submission.isSubmitting}
          draft={managementDraft}
          mapEntryId={initialData?.mapEntryId}
          mode={mode}
          onDraftChange={setManagementDraft}
          onReadyChange={setManagementReady}
          ownerRemovalGroup="prestataires"
          ownerTitle="Prestataires"
        />
      </FormSection>

      <FormActions
        canSubmit={submission.canSubmit}
        entitySlug={initialData?.slug ?? input.slug}
        entityType="service"
        error={submission.error}
        isSubmitting={submission.isSubmitting}
        mode={mode}
        onCancel={onCancel}
        onDelete={mode === 'edit' && onDelete ? () => void remove() : undefined}
      />
    </form>
  );
}
