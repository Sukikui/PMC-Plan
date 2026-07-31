'use client';

import {
  useId,
  useState,
  type ReactNode,
} from 'react';
import {
  suggestionDropdownClass,
  suggestionOptionClass,
} from './form-utils';
import { formInputClassName } from './form-styles';
import { useSuggestionHighlight } from './useSuggestionHighlight';

interface SearchComboboxProps<T> {
  disabled?: boolean;
  getKey: (item: T) => string;
  items: T[];
  name: string;
  onQueryChange: (query: string) => void;
  onSelect: (item: T) => Promise<boolean> | boolean;
  placeholder: string;
  query: string;
  renderItem: (item: T, highlighted: boolean) => ReactNode;
}

export default function SearchCombobox<T>({
  disabled = false,
  getKey,
  items,
  name,
  onQueryChange,
  onSelect,
  placeholder,
  query,
  renderItem,
}: SearchComboboxProps<T>) {
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const listId = useId();
  const dropdownOpen = focused && !dismissed && items.length > 0;
  const navigation = useSuggestionHighlight(items.length, dropdownOpen);

  const selectItem = async (item: T) => {
    if (disabled) return;
    const selected = await Promise.resolve(onSelect(item));
    if (!selected) return;
    onQueryChange('');
    setDismissed(false);
    navigation.resetHighlight();
  };

  return (
    <div className="relative">
      <input
        aria-activedescendant={
          dropdownOpen && navigation.highlightedIndex !== null
            ? `${listId}-option-${navigation.highlightedIndex}`
            : undefined
        }
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={dropdownOpen}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        className={formInputClassName}
        disabled={disabled}
        name={name}
        onBlur={() => {
          setFocused(false);
          navigation.resetHighlight();
        }}
        onChange={(event) => {
          onQueryChange(event.target.value);
          setDismissed(false);
        }}
        onFocus={() => setFocused(true)}
        onKeyDown={(event) => {
          if (
            (event.key === 'ArrowDown' || event.key === 'ArrowUp')
            && items.length > 0
          ) {
            event.preventDefault();
            setDismissed(false);
            navigation.moveHighlight(event.key === 'ArrowDown' ? 1 : -1);
            return;
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            if (dropdownOpen && navigation.highlightedIndex !== null) {
              void selectItem(items[navigation.highlightedIndex]);
            }
            return;
          }
          if (event.key === 'Escape' && dropdownOpen) {
            event.preventDefault();
            setDismissed(true);
            navigation.resetHighlight();
          }
        }}
        placeholder={placeholder}
        role="combobox"
        spellCheck={false}
        type="text"
        value={query}
      />

      {dropdownOpen && (
        <div className={`${suggestionDropdownClass} max-h-72 overflow-y-auto`}>
          <ul className="py-1" id={listId} role="listbox">
            {items.map((item, index) => {
              const highlighted = index === navigation.highlightedIndex;
              return (
                <li
                  aria-selected={highlighted}
                  id={`${listId}-option-${index}`}
                  key={getKey(item)}
                  role="option"
                >
                  <button
                    className={`${suggestionOptionClass} px-3 py-2`}
                    disabled={disabled}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      void selectItem(item);
                    }}
                    onMouseEnter={() => navigation.setHighlightedIndex(index)}
                    tabIndex={-1}
                    type="button"
                  >
                    {renderItem(item, highlighted)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
