import type { ReactNode } from 'react';
import ContentSummaryRow from '@/components/content/ContentSummaryRow';
import SpaceLogo from '@/components/spaces/SpaceLogo';
import UserAvatar from '@/components/ui/UserAvatar';
import type { MapEntryIdentity } from '@/lib/map-entry/types';
import type { SpaceReference } from '@/lib/spaces/types';

interface AccountContentRowProps {
  additionalManagerCount: number;
  association?: SpaceReference | null;
  identity: ReactNode;
  manager: MapEntryIdentity;
  metadata?: ReactNode;
  name: string;
  onOpen: () => void;
}

export default function AccountContentRow({
  additionalManagerCount,
  association,
  identity,
  manager,
  metadata,
  name,
  onOpen,
}: AccountContentRowProps) {
  return (
    <ContentSummaryRow
      identity={identity}
      metadata={metadata}
      name={name}
      onOpen={onOpen}
      person={{
        avatar: (
          <UserAvatar
            alt=""
            className="h-8 w-8"
            src={manager.image}
          />
        ),
        label: getManagerName(manager),
        suffix: additionalManagerCount > 0
          ? `+ ${additionalManagerCount}`
          : undefined,
      }}
      reserveSecondaryColumn
      secondary={association ? {
        avatar: (
          <SpaceLogo
            color={association.color}
            logoBackground={association.logoBackground}
            logoUrl={association.logoUrl}
            logoZoom={association.logoZoom}
            name={association.name}
            size="compact"
          />
        ),
        label: association.name,
      } : null}
    />
  );
}

function getManagerName(manager: MapEntryIdentity) {
  return manager.name ?? manager.username ?? 'Utilisateur Discord';
}
