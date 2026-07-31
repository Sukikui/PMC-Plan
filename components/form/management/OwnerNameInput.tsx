'use client';

import { useState } from 'react';
import ActionButton from '@/components/ui/ActionButton';
import { managementInputClass } from './ManagementUi';

interface OwnerNameInputProps {
  busy: boolean;
  onAdd: (name: string) => Promise<boolean> | boolean;
}

export default function OwnerNameInput({
  busy,
  onAdd,
}: OwnerNameInputProps) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = !busy && !submitting && name.trim().length >= 3;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const added = await Promise.resolve(onAdd(name.trim()));
      if (added) setName('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <input
        className={managementInputClass}
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          void submit();
        }}
        placeholder="Pseudo Minecraft"
      />
      <ActionButton
        className="shrink-0"
        disabled={!canSubmit}
        variant="neutralOutline"
        onClick={() => void submit()}
      >
        Ajouter
      </ActionButton>
    </div>
  );
}
