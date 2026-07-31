'use client';

import { PillActionLink } from '@/components/ui/PillAction';
import SectionSeparator from '@/components/ui/SectionSeparator';
import { themeColors } from '@/lib/theme-colors';
import CreditVisual, { BrandMark } from './CreditVisual';
import { creditGroups, type CreditItem } from './credits-data';

export default function CreditsSettings() {
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
