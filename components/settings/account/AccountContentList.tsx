'use client';

import { useState } from 'react';
import ContentManagementList from '@/components/settings/content/ContentManagementList';
import ContentManagementTabs from '@/components/settings/content/ContentManagementTabs';
import type { ContentManagementType } from '@/lib/content-management/types';
import type { SelectDestinationHandler } from '@/lib/destination/selection';
import { themeColors } from '@/lib/theme-colors';

export default function AccountContentList({
  onSelectItem,
}: {
  onSelectItem?: SelectDestinationHandler;
}) {
  const [activePage, setActivePage] = useState<ContentManagementType>('place');

  return (
    <section aria-label="Gérer mon contenu" className="space-y-4">
      <h3 className={`text-sm font-semibold ${themeColors.text.primary}`}>
        Gérer mon contenu
      </h3>
      <ContentManagementTabs
        activePage={activePage}
        onChange={(page) => {
          if (page !== 'users') setActivePage(page);
        }}
      />
      <ContentManagementList
        key={activePage}
        onSelectItem={onSelectItem}
        scope="managed"
        type={activePage}
      />
    </section>
  );
}
