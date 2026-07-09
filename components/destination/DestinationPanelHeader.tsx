'use client';

import ClearIcon from '@/components/icons/ClearIcon';
import { themeColors } from '@/lib/theme-colors';
import type { DestinationListItem, TagFilterLogic } from './destination-panel-types';

interface DestinationPanelHeaderProps {
  allTags: string[];
  enabledTags: Set<string>;
  tagFilterLogic: TagFilterLogic;
  searchQuery: string;
  highlightedDestination: DestinationListItem | null;
  hasSelectedDestination: boolean;
  isSearchHighlightActive: boolean;
  selectedMatchesHighlightedDestination: boolean;
  filteredDestinationsLength: number;
  onClearTags: () => void;
  onSearchBlur: () => void;
  onSearchFocus: () => void;
  onSearchQueryChange: (query: string) => void;
  onSelectHighlightedDestination: (destination: DestinationListItem) => void;
  onSetHighlightedDestinationIndex: (updater: (currentIndex: number) => number) => void;
  onSetSearchHighlightActive: (active: boolean) => void;
  onToggleTag: (tag: string) => void;
  onToggleTagFilterLogic: () => void;
}

export default function DestinationPanelHeader({
  allTags,
  enabledTags,
  tagFilterLogic,
  searchQuery,
  highlightedDestination,
  hasSelectedDestination,
  isSearchHighlightActive,
  selectedMatchesHighlightedDestination,
  filteredDestinationsLength,
  onClearTags,
  onSearchBlur,
  onSearchFocus,
  onSearchQueryChange,
  onSelectHighlightedDestination,
  onSetHighlightedDestinationIndex,
  onSetSearchHighlightActive,
  onToggleTag,
  onToggleTagFilterLogic,
}: DestinationPanelHeaderProps) {
  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (filteredDestinationsLength === 0 || hasSelectedDestination) {
        return;
      }

      event.preventDefault();
      if (!isSearchHighlightActive) {
        onSetSearchHighlightActive(true);
        onSetHighlightedDestinationIndex(() => event.key === 'ArrowDown' ? 0 : filteredDestinationsLength - 1);
        return;
      }

      onSetHighlightedDestinationIndex((currentIndex) => {
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        return (currentIndex + direction + filteredDestinationsLength) % filteredDestinationsLength;
      });
      return;
    }

    if (
      event.key !== 'Enter' ||
      !highlightedDestination ||
      !isSearchHighlightActive ||
      (hasSelectedDestination && !selectedMatchesHighlightedDestination)
    ) {
      return;
    }

    event.preventDefault();
    onSelectHighlightedDestination(highlightedDestination);
  };

  return (
    <>
      <div>
        <div className={`text-xs font-semibold ${themeColors.text.secondary} mb-2 ${themeColors.util.uppercase} ${themeColors.transition}`}>Filtrer par tags</div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={onToggleTagFilterLogic}
            className={`w-10 py-1 px-2 ${themeColors.util.roundedFull} border ${themeColors.transition} font-semibold flex items-center justify-center ${themeColors.tag.filterLogic}`}
            title={`Mode actuel: ${tagFilterLogic === 'SINGLE' ? 'Un seul tag' : tagFilterLogic === 'OR' ? 'OU (au moins un tag)' : 'ET (tous les tags)'}`}
          >
            <TagFilterLogicIcon mode={tagFilterLogic} />
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`px-2 py-1 text-xs ${themeColors.util.roundedFull} border ${themeColors.transition} ${
                enabledTags.has(tag) ? themeColors.tag.active : themeColors.tag.inactive
              }`}
            >
              {tag}
            </button>
          ))}
          {enabledTags.size > 0 && (
            <button
              onClick={onClearTags}
              className={`flex items-center justify-center ${themeColors.text.secondary} ${themeColors.interactive.hoverText} ${themeColors.transition}`}
              aria-label="Effacer les tags"
            >
              <ClearIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className={`text-xs font-semibold ${themeColors.text.secondary} mb-2 ${themeColors.util.uppercase} ${themeColors.transition}`}>Rechercher</div>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => {
              onSearchQueryChange(event.target.value);
              onSetSearchHighlightActive(true);
            }}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            onKeyDown={handleSearchKeyDown}
            placeholder="Nom, description, tags, monde..."
            className={`w-full px-3 py-2 text-sm ${themeColors.input.search} border ${themeColors.util.roundedLg} focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder}`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange('')}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${themeColors.text.secondary} ${themeColors.interactive.hoverText} ${themeColors.transition}`}
            >
              <ClearIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function TagFilterLogicIcon({ mode }: { mode: TagFilterLogic }) {
  if (mode === 'SINGLE') {
    return (
      <svg className="w-4 h-4" viewBox="-2 0 28 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="currentColor" />
      </svg>
    );
  }

  if (mode === 'OR') {
    return (
      <svg className="w-4 h-4" viewBox="-2 0 28 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
        <circle cx="5" cy="12" r="8" fill="currentColor" />
        <circle cx="19" cy="12" r="8" />
      </svg>
    );
  }

  return (
    <svg className="w-4 h-4" viewBox="-2 0 28 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="12" r="8" />
      <circle cx="17" cy="12" r="8" />
      <ellipse cx="12" cy="12" rx="3" ry="5.6" fill="currentColor" />
    </svg>
  );
}

