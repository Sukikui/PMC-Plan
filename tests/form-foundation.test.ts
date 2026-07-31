import {
  areEntityFieldsValid,
  normalizeEntityFields,
} from '@/components/form/common/entity-fields';
import { parseCoordinateTriplet } from '@/components/form/common/form-values';
import {
  getMapEntryDeleteEndpoint,
  getMapEntrySaveEndpoint,
} from '@/components/form/form-endpoints';
import {
  getTradeOffersValidationError,
} from '@/components/form/place/place-offer-payload';
import { CONTENT_FIELD_LIMITS } from '@/lib/content/constraints';

describe('content form foundation', () => {
  it('normalizes the shared name, slug and description fields', () => {
    const fields = normalizeEntityFields({
      description: '  Description  ',
      name: '  Valny Frost  ',
      slug: '',
      slugManuallyEdited: false,
    });

    expect(fields).toEqual({
      description: 'Description',
      name: 'Valny Frost',
      slug: 'valny-frost',
    });
    expect(areEntityFieldsValid(fields)).toBe(true);
  });

  it('rejects empty required shared fields', () => {
    const fields = normalizeEntityFields({
      description: '',
      name: ' ',
      slug: '',
      slugManuallyEdited: false,
    });

    expect(areEntityFieldsValid(fields)).toBe(false);
  });

  it('does not interpret empty coordinates as zero', () => {
    expect(parseCoordinateTriplet({ x: '', y: '', z: '' })).toBeNull();
    expect(parseCoordinateTriplet({ x: '0', y: '64', z: '-12' })).toEqual({
      x: 0,
      y: 64,
      z: -12,
    });
  });

  it('uses the expected portal endpoints for linked and single portals', () => {
    expect(getMapEntrySaveEndpoint('portal', 'edit', {
      id: 'spawn',
      type: 'portal',
      variant: 'linked',
    })).toBe('/api/portals/spawn?world=overworld');
    expect(getMapEntryDeleteEndpoint({
      id: 'spawn',
      type: 'portal',
      variant: 'linked',
    })).toBe('/api/portals/spawn');
    expect(getMapEntryDeleteEndpoint({
      id: 'spawn',
      type: 'portal',
      variant: 'nether',
    })).toBe('/api/portals/spawn?world=nether');
  });

  it('shares field constraints across entity types', () => {
    expect(CONTENT_FIELD_LIMITS.name).toBe(40);
    expect(CONTENT_FIELD_LIMITS.slug).toBe(40);
    expect(CONTENT_FIELD_LIMITS.description).toBe(2000);
    expect(CONTENT_FIELD_LIMITS.shortText).toBe(100);
    expect(CONTENT_FIELD_LIMITS.customName).toBe(200);
    expect(CONTENT_FIELD_LIMITS.discordUrl).toBe(256);
  });

  it('limits generated slugs to the shared content identity length', () => {
    const fields = normalizeEntityFields({
      description: '',
      name: 'a'.repeat(CONTENT_FIELD_LIMITS.name),
      slug: '',
      slugManuallyEdited: false,
    });

    expect(fields.slug).toHaveLength(CONTENT_FIELD_LIMITS.slug);
  });

  it('reports incomplete trade offers before submission', () => {
    expect(getTradeOffersValidationError([{
      id: 'offer-1',
      negotiable: false,
      description: null,
      gives: {
        item_id: '',
        quantity: '',
        enchanted: false,
        custom_name: null,
      },
      wants: {
        item_id: '',
        quantity: '',
        enchanted: false,
        custom_name: null,
      },
    }])).toBe('Chaque offre doit préciser au moins un objet proposé.');
  });
});
