'use client';

import { useQuery } from '@tanstack/react-query';
import { PillActionLink } from '@/components/ui/PillAction';
import SectionSeparator from '@/components/ui/SectionSeparator';
import UserAvatar from '@/components/ui/UserAvatar';
import { queryKeys } from '@/lib/query/keys';
import { themeColors } from '@/lib/theme-colors';
import CreditVisual, { BrandMark } from './CreditVisual';
import { creditGroups, type CreditItem } from './credits-data';

export default function CreditsSettings({ active }: { active: boolean }) {
  const contributorsQuery = useQuery({
    enabled: active,
    queryKey: queryKeys.githubContributors,
    queryFn: fetchGitHubContributors,
    staleTime: 60 * 60_000,
  });

  return (
    <div>
      {creditGroups.map((group, index) => (
        <section key={group.title}>
          {index > 0 && <SectionSeparator className="my-6" />}
          <h3 className={`mb-2 text-sm font-semibold ${themeColors.text.primary}`}>
            {group.title}
          </h3>
          <div>
            {group.items.map((item) => <CreditRow key={item.name} item={item} />)}
          </div>
        </section>
      ))}

      <SectionSeparator className="my-6" />
      <section>
        <h3 className={`mb-4 text-sm font-semibold ${themeColors.text.primary}`}>
          Contributeurs
        </h3>
        {contributorsQuery.isPending ? (
          <p className={`py-3 text-xs ${themeColors.text.tertiary}`}>
            Chargement...
          </p>
        ) : contributorsQuery.isError ? (
          <p className={`py-3 text-xs ${themeColors.text.tertiary}`}>
            Contributeurs indisponibles.
          </p>
        ) : (
          <div className="flex flex-wrap gap-x-8 gap-y-3 py-1">
            {contributorsQuery.data.map((contributor) => (
              <ContributorLink key={contributor.login} contributor={contributor} />
            ))}
          </div>
        )}
      </section>

      <SectionSeparator className="my-6" />
      <div className="flex justify-center">
        <PillActionLink
          href="https://github.com/Sukikui/PMC-Plan"
          target="_blank"
          rel="noopener noreferrer"
        >
          <BrandMark name="github" className="h-4 w-4" monochrome />
          Consulter le code source
        </PillActionLink>
      </div>
    </div>
  );
}

function CreditRow({ item }: { item: CreditItem }) {
  return (
    <div className={`flex items-center gap-3 border-t py-3 first:border-t-0 ${themeColors.border.primary}`}>
      <CreditVisual visual={item.visual} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className={`text-sm font-medium ${themeColors.text.primary}`}>{item.name}</span>
          {item.version && (
            <span className={`text-xs ${themeColors.text.muted}`}>v{item.version}</span>
          )}
        </div>
        <p className={`text-xs ${themeColors.text.tertiary}`}>{item.description}</p>
      </div>
      {item.href && (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`shrink-0 text-xs font-medium ${themeColors.text.accent} ${themeColors.interactive.hoverAccentText}`}
        >
          Ouvrir
        </a>
      )}
    </div>
  );
}

interface GitHubContributor {
  avatar_url: string;
  html_url: string;
  login: string;
  type: string;
}

function ContributorLink({ contributor }: { contributor: GitHubContributor }) {
  return (
    <a
      href={contributor.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center gap-2 ${themeColors.interactive.focusRing}`}
    >
      <UserAvatar
        src={contributor.avatar_url}
        alt={`Avatar GitHub de ${contributor.login}`}
        className="h-8 w-8"
      />
      <span className={`text-sm ${themeColors.text.primary} ${themeColors.interactive.groupHoverAccentText}`}>
        {contributor.login}
      </span>
    </a>
  );
}

async function fetchGitHubContributors(): Promise<GitHubContributor[]> {
  const response = await fetch(
    'https://api.github.com/repos/Sukikui/PMC-Plan/contributors?per_page=100',
  );
  if (!response.ok) {
    throw new Error('Unable to load GitHub contributors.');
  }

  const contributors = await response.json() as GitHubContributor[];
  return contributors.filter((contributor) => (
    contributor.type === 'User' && !contributor.login.endsWith('[bot]')
  ));
}
