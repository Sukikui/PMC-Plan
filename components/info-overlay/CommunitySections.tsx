import type { MinecraftOwner } from '@/lib/map-entry/types';
import DiscordServerSection from './DiscordServerSection';
import MinecraftProfileList from './MinecraftProfileList';

interface CommunitySectionsProps {
  discordUrl?: string | null;
  pluralTitle: string;
  profiles: MinecraftOwner[];
  singularTitle: string;
}

export default function CommunitySections({
  discordUrl,
  pluralTitle,
  profiles,
  singularTitle,
}: CommunitySectionsProps) {
  if (profiles.length === 0 && !discordUrl) return null;

  return (
    <div className="flex flex-wrap items-start gap-x-12 gap-y-6">
      <MinecraftProfileList
        pluralTitle={pluralTitle}
        profiles={profiles}
        singularTitle={singularTitle}
      />
      {discordUrl && <DiscordServerSection discordUrl={discordUrl} />}
    </div>
  );
}
