import QuestionMarkIcon from '@/components/icons/QuestionMarkIcon';
import { UNIDENTIFIED_PORTAL_LABEL } from '@/lib/portal/identity';

export default function PortalIdentityLabel({
  className = '',
  iconClassName = 'h-[1em] w-[1em]',
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={`inline-flex min-w-0 max-w-full items-center gap-1.5 whitespace-nowrap ${className}`}
    >
      <QuestionMarkIcon className={`${iconClassName} shrink-0`} />
      <span className="truncate">{UNIDENTIFIED_PORTAL_LABEL}</span>
    </span>
  );
}
