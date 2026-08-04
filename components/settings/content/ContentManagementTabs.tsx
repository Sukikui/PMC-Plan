import { themeColors } from '@/lib/theme-colors';
import type { ContentManagementType } from '@/lib/content-management/types';

export type ContentManagementPage = 'users' | ContentManagementType;

export default function ContentManagementTabs({
  activePage,
  includeUsers = false,
  onChange,
}: {
  activePage: ContentManagementPage;
  includeUsers?: boolean;
  onChange: (page: ContentManagementPage) => void;
}) {
  const pages = includeUsers ? allPages : contentPages;

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
      {pages.map(({ label, value }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`${themeColors.toggle.compactBase} shrink-0 ${
            activePage === value
              ? themeColors.toggle.activeBlue
              : themeColors.toggle.inactive
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const contentPages: Array<{
  label: string;
  value: ContentManagementType;
}> = [
  { value: 'place', label: 'Lieux' },
  { value: 'portal', label: 'Portails' },
  { value: 'space', label: 'Espaces' },
  { value: 'service', label: 'Services' },
];

const allPages: Array<{
  label: string;
  value: ContentManagementPage;
}> = [
  { value: 'users', label: 'Utilisateurs' },
  ...contentPages,
];
