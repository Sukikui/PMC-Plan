'use client';

import { useState } from 'react';
import type { Session } from 'next-auth';
import InformationCircleIcon from '@/components/icons/InformationCircleIcon';
import CommonFields from '@/components/form/common/CommonFields';
import DiscordUrlField from '@/components/form/common/DiscordUrlField';
import FormActions from '@/components/form/common/FormActions';
import FormField from '@/components/form/common/FormField';
import FormSection from '@/components/form/common/FormSection';
import { imageUrlPlaceholder } from '@/components/form/common/form-placeholders';
import { formInputClassName } from '@/components/form/common/form-styles';
import { useEntityForm } from '@/components/form/common/useEntityForm';
import { useFormSubmission } from '@/components/form/common/useFormSubmission';
import ManagedUsersField from '@/components/form/management/ManagedUsersField';
import {
  appendUniqueManagedUser,
  removeManagedUser,
  toManagedIdentity,
} from '@/components/form/management/managed-users';
import { canAdministerContent } from '@/lib/content-permissions';
import { DEFAULT_SPACE_COLOR } from '@/lib/spaces/colors';
import {
  DEFAULT_SPACE_LOGO_BACKGROUND,
  DEFAULT_SPACE_LOGO_ZOOM,
  MAX_SPACE_LOGO_ZOOM,
  MIN_SPACE_LOGO_ZOOM,
  SPACE_LOGO_URL_MAX_LENGTH,
  SPACE_LOGO_ZOOM_STEP,
} from '@/lib/spaces/constants';
import type {
  Space,
  SpaceInput,
  SpaceLogoBackground,
  SpaceUser,
} from '@/lib/spaces/types';
import { themeColors } from '@/lib/theme-colors';
import SpaceColorPicker from './SpaceColorPicker';
import SpaceLogo from './SpaceLogo';
import SpaceLogoBackgroundSelector from './SpaceLogoBackgroundSelector';
import SpaceRangeField, {
  spaceRangeSectionClassName,
} from './SpaceRangeField';

interface SpaceFormProps {
  effectiveRole?: string;
  mode: 'add' | 'edit';
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  onSubmit: (input: SpaceInput) => Promise<void>;
  onTransfer?: (userId: string, confirmation: string) => Promise<void>;
  space?: Space;
  user: Session['user'];
}

export default function SpaceForm({
  effectiveRole,
  mode,
  onCancel,
  onDelete,
  onSubmit,
  onTransfer,
  space,
  user,
}: SpaceFormProps) {
  const fields = useEntityForm(
    space?.name,
    space?.slug,
    space?.description ?? '',
  );
  const [details, setDetails] = useState(() => getInitialDetails(space));

  const primaryManager = space?.primaryManager ?? toManagedIdentity(user);
  const canManageTeam = mode === 'add' || Boolean(space && canAdministerContent(
    effectiveRole,
    user.id,
    space.primaryManagerId,
  ));
  const input = normalizeInput({
    ...details,
    ...fields.input,
  });
  const submission = useFormSubmission({
    isValid: fields.isValid,
    mode,
    snapshot: input,
  });

  const save = async (event: React.FormEvent) => {
    await submission.submit(event, () => onSubmit(input));
  };

  const transfer = async (userId: string, confirmation: string) => {
    if (!onTransfer) return false;
    return submission.execute(() => onTransfer(userId, confirmation));
  };

  const remove = async () => {
    if (!onDelete) return;
    await submission.execute(onDelete);
  };

  return (
    <form className="space-y-5" onSubmit={save}>
      <FormSection title="Informations générales">
        <CommonFields
          afterSlug={(
            <DiscordUrlField
              disabled={submission.isSubmitting}
              onChange={(discordUrl) => setDetails((current) => ({
                ...current,
                discordUrl,
              }))}
              value={details.discordUrl ?? ''}
            />
          )}
          descriptionPlaceholder="Présentez rapidement cet espace."
          disabled={submission.isSubmitting}
          form={fields}
          namePlaceholder="Valnyfrost"
          slugPlaceholder="valnyfrost"
        />

        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <SpaceLogo
            color={input.color}
            logoBackground={input.logoBackground}
            logoUrl={input.logoUrl}
            logoZoom={input.logoZoom}
            name={input.name || 'Valnyfrost'}
            size="large"
          />
          <div className="space-y-4">
            <FormField label="Logo (optionnel)">
              <input
                autoComplete="off"
                className={formInputClassName}
                disabled={submission.isSubmitting}
                maxLength={SPACE_LOGO_URL_MAX_LENGTH}
                placeholder={imageUrlPlaceholder('logo')}
                type="url"
                value={details.logoUrl ?? ''}
                onChange={(event) => setDetails((current) => ({
                  ...current,
                  logoUrl: event.target.value,
                }))}
              />
            </FormField>
          </div>
        </div>

        {input.logoUrl && (
          <div className={spaceRangeSectionClassName}>
            <SpaceRangeField
              accentHandle
              disabled={submission.isSubmitting}
              label="Zoom du logo"
              max={MAX_SPACE_LOGO_ZOOM}
              min={MIN_SPACE_LOGO_ZOOM}
              step={SPACE_LOGO_ZOOM_STEP}
              value={input.logoZoom ?? DEFAULT_SPACE_LOGO_ZOOM}
              onChange={(logoZoom) => setDetails((current) => ({
                ...current,
                logoZoom,
              }))}
            />
            <SpaceLogoBackgroundSelector
              disabled={submission.isSubmitting}
              value={input.logoBackground ?? DEFAULT_SPACE_LOGO_BACKGROUND}
              onChange={(logoBackground) => setDetails((current) => ({
                ...current,
                logoBackground,
              }))}
            />
          </div>
        )}

        <SpaceColorPicker
          disabled={submission.isSubmitting}
          value={input.color}
          onChange={(color) => setDetails((current) => ({ ...current, color }))}
        />
      </FormSection>

      <FormSection title="Gestion">
        <ManagedUsersField
          busy={submission.isSubmitting}
          canManageTeam={canManageTeam}
          managers={details.managers}
          onAdd={(manager) => {
            if (details.managers.some(({ id }) => id === manager.id)) {
              return false;
            }
            setDetails((current) => ({
              ...current,
              managers: appendUniqueManagedUser(current.managers, manager),
            }));
            return true;
          }}
          onError={submission.setError}
          onRemove={(userId) => setDetails((current) => ({
            ...current,
            managers: removeManagedUser(current.managers, userId),
          }))}
          onTransfer={mode === 'edit' && canManageTeam && onTransfer
            ? transfer
            : undefined}
          primaryManager={primaryManager}
        />
        <div className={`mt-3 flex items-start gap-2 border-t pt-3 ${themeColors.border.light} ${themeColors.text.tertiary}`}>
          <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-xs leading-relaxed">
            Les membres affichés par leur pseudo Minecraft seront
            automatiquement déterminés à partir des propriétaires des lieux
            et des portails rattachés à l’espace.
          </p>
        </div>
      </FormSection>

      <FormActions
        canSubmit={submission.canSubmit}
        entitySlug={space?.slug ?? input.slug}
        entityType="space"
        error={submission.error}
        isSubmitting={submission.isSubmitting}
        mode={mode}
        onCancel={onCancel}
        onDelete={mode === 'edit' && canManageTeam && onDelete
          ? () => void remove()
          : undefined}
      />
    </form>
  );
}

interface SpaceDetailsDraft {
  color: string;
  discordUrl: string | null;
  logoBackground: SpaceLogoBackground;
  logoUrl: string | null;
  logoZoom: number;
  managers: SpaceUser[];
}

function getInitialDetails(space?: Space): SpaceDetailsDraft {
  return {
    color: space?.color ?? DEFAULT_SPACE_COLOR,
    discordUrl: space?.discordUrl ?? null,
    logoBackground: space?.logoBackground ?? DEFAULT_SPACE_LOGO_BACKGROUND,
    logoUrl: space?.logoUrl ?? null,
    logoZoom: space?.logoZoom ?? DEFAULT_SPACE_LOGO_ZOOM,
    managers: space?.managers ?? [],
  };
}

interface NormalizeSpaceInput extends SpaceDetailsDraft {
  description: string;
  name: string;
  slug: string;
}

function normalizeInput(draft: NormalizeSpaceInput): SpaceInput {
  return {
    name: draft.name.trim(),
    slug: draft.slug,
    description: draft.description.trim() || null,
    discordUrl: draft.discordUrl?.trim() || null,
    color: draft.color.toUpperCase(),
    logoUrl: draft.logoUrl?.trim() || null,
    logoBackground: draft.logoBackground,
    logoZoom: draft.logoZoom,
    managerIds: draft.managers.map(({ id }) => id),
  };
}
