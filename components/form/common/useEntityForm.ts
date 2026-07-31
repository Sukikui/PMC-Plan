import { useState } from 'react';
import {
  areEntityFieldsValid,
  normalizeEntityFields,
} from './entity-fields';

export function useEntityForm(initialName = '', initialId = '', initialDescription = '') {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialId);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialId);
  const [description, setDescription] = useState(initialDescription);
  const input = normalizeEntityFields({
    description,
    name,
    slug,
    slugManuallyEdited,
  });

  return {
    input,
    isValid: areEntityFieldsValid(input),
    name,
    setName,
    slug,
    setSlug,
    slugManuallyEdited,
    setSlugManuallyEdited,
    description,
    setDescription,
  };
}

export type EntityFormController = ReturnType<typeof useEntityForm>;
