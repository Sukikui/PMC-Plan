import { slugify } from './form-values';

export interface EntityFieldsDraft {
  description: string;
  name: string;
  slug: string;
  slugManuallyEdited: boolean;
}

export interface NormalizedEntityFields {
  description: string;
  name: string;
  slug: string;
}

export function normalizeEntityFields({
  description,
  name,
  slug,
  slugManuallyEdited,
}: EntityFieldsDraft): NormalizedEntityFields {
  return {
    description: description.trim(),
    name: name.trim(),
    slug: slugify(slugManuallyEdited ? slug : name),
  };
}

export function areEntityFieldsValid(fields: NormalizedEntityFields) {
  return fields.name.length > 0 && fields.slug.length > 0;
}
