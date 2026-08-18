import type { ReactNode } from 'react';
import type { SpaceReference } from '@/lib/spaces/types';
import ColorPicker from './ColorPicker';
import FormHint from './FormHint';
import FormSection from './FormSection';

interface ContentColorFieldProps {
  color: string;
  disabled?: boolean;
  entityLabel: 'espace' | 'lieu' | 'portail';
  onChange: (color: string) => void;
  space?: SpaceReference | null;
}

interface ContentPresentationSectionProps {
  children: ReactNode;
}

export function ContentPresentationSection({
  children,
}: ContentPresentationSectionProps) {
  return <FormSection title="Présentation">{children}</FormSection>;
}

export default function ContentColorField({
  color,
  disabled = false,
  entityLabel,
  onChange,
  space = null,
}: ContentColorFieldProps) {
  const ariaLabel = entityLabel === 'espace'
    ? 'Couleur de l’espace'
    : `Couleur du ${entityLabel}`;

  return (
    <div className="space-y-3">
      <ColorPicker
        ariaLabel={ariaLabel}
        disabled={disabled}
        onChange={onChange}
        value={color}
      />
      {space && (
        <FormHint>
          La couleur de l’espace {space.name} est prioritaire tant que ce
          contenu lui est rattaché.
        </FormHint>
      )}
    </div>
  );
}
