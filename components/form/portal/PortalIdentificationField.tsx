import ActionButton from '@/components/ui/ActionButton';
import FormHint from '@/components/form/common/FormHint';

export default function PortalIdentificationField({
  disabled,
  unidentified,
  onChange,
}: {
  disabled: boolean;
  unidentified: boolean;
  onChange: (unidentified: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <ActionButton
        disabled={disabled}
        onClick={() => onChange(!unidentified)}
        type="button"
        variant={unidentified ? 'primary' : 'neutralOutline'}
      >
        {unidentified ? 'Renseigner les informations' : 'Marquer comme inconnu'}
      </ActionButton>
      <FormHint>
        Utilise ce mode pour enregistrer un portail rencontré dont tu ignores
        le nom ou le propriétaire. Ses informations seront limitées et
        n’importe quel utilisateur approuvé pourra ensuite le revendiquer pour
        les compléter.
      </FormHint>
    </div>
  );
}
