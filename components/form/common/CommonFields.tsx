import React from 'react';
import { themeColors } from '@/lib/theme-colors';
import { renderOwnersInput, slugify } from './form-utils';

const inputClass = `${themeColors.input.search} border ${themeColors.util.roundedLg} px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder}`;

interface CommonFieldsProps {
  name: string;
  setName: (name: string) => void;
  slug: string;
  setSlug: (slug: string) => void;
  slugManuallyEdited: boolean;
  setSlugManuallyEdited: (edited: boolean) => void;
  ownersInput: string;
  setOwnersInput: (owners: string) => void;
  description: string;
  setDescription: (description: string) => void;
  namePlaceholder: string;
  slugPlaceholder: string;
}

export default function CommonFields({ name, setName, slug, setSlug, slugManuallyEdited, setSlugManuallyEdited, ownersInput, setOwnersInput, description, setDescription, namePlaceholder, slugPlaceholder }: CommonFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Nom</label>
        <input
          className={inputClass}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={namePlaceholder}
        />
      </div>

      <div className="space-y-1">
        <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Identifiant (slug)</label>
        <input
          className={inputClass}
          value={slugManuallyEdited ? slug : slugify(name)}
          onChange={(event) => {
            setSlug(event.target.value);
            setSlugManuallyEdited(true);
          }}
          placeholder={slugPlaceholder}
        />
      </div>

      {renderOwnersInput(ownersInput, setOwnersInput)}

      <div className="space-y-1">
        <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Description (optionnel)</label>
        <textarea
          className={`${inputClass} min-h-[80px] resize-y`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Présentez rapidement votre lieu, ses services et comment y accéder."
        />
      </div>
    </div>
  );
}
