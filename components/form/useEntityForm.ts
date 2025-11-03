import { useState, useEffect, useMemo } from 'react';
import { slugify, parseOwners } from './form-utils';

export function useEntityForm(initialName = '', initialId = '', initialOwners: string[] = [], initialDescription = '') {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialId);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialId);
  const [ownersInput, setOwnersInput] = useState(initialOwners.join(', '));
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(slugify(name));
    }
  }, [name, slugManuallyEdited]);

  const ownersList = useMemo(() => parseOwners(ownersInput), [ownersInput]);

  return {
    name,
    setName,
    slug,
    setSlug,
    slugManuallyEdited,
    setSlugManuallyEdited,
    ownersInput,
    setOwnersInput,
    ownersList,
    description,
    setDescription,
  };
}
