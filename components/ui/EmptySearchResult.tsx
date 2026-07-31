import type { ReactNode } from 'react';
import { themeColors } from '@/lib/theme-colors';

interface EmptySearchResultProps {
  children?: ReactNode;
}

export default function EmptySearchResult({
  children,
}: EmptySearchResultProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-12 text-center ${themeColors.text.tertiary}`}>
      <p>Aucun résultat. (｡•́︿•̀｡)</p>
      {children}
    </div>
  );
}
