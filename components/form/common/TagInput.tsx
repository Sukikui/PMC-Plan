import React, { useMemo, useState } from 'react';
import ClearIcon from '@/components/icons/ClearIcon';
import { themeColors } from '@/lib/theme-colors';
import {
  suggestionDropdownClass,
  suggestionOptionClass,
} from './form-utils';
import { useSuggestionHighlight } from './useSuggestionHighlight';

interface TagInputProps {
  label: string;
  placeholder?: string;
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
}

const normalizeTag = (tag: string) => tag.trim();

export default function TagInput({ label, placeholder, value, onChange, suggestions = [] }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [queryValue, setQueryValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const normalizedValue = useMemo(() => {
    const unique = new Map<string, string>();
    value.forEach((tag) => {
      const normalized = normalizeTag(tag);
      if (!normalized) return;
      const key = normalized.toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, normalized);
      }
    });
    return Array.from(unique.values());
  }, [value]);

  const filteredSuggestions = useMemo(() => {
    const query = normalizeTag(queryValue).toLowerCase();
    if (!query) {
      return [];
    }
    return suggestions.filter((tag) => {
      const normalized = normalizeTag(tag);
      if (!normalized) return false;
      if (normalizedValue.some((existing) => existing.toLowerCase() === normalized.toLowerCase())) {
        return false;
      }
      return normalized.toLowerCase().includes(query);
    });
  }, [queryValue, suggestions, normalizedValue]);

  const suggestionNavigation = useSuggestionHighlight(
    filteredSuggestions.length,
    isFocused,
  );

  const addTag = (rawTag: string) => {
    const nextTag = normalizeTag(rawTag);
    if (!nextTag) {
      return;
    }
    if (normalizedValue.some((existing) => existing.toLowerCase() === nextTag.toLowerCase())) {
      setInputValue('');
      return;
    }
    onChange([...normalizedValue, nextTag]);
    setInputValue('');
  };

  const removeTag = (tag: string) => {
    const next = normalizedValue.filter((existing) => existing.toLowerCase() !== tag.toLowerCase());
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <label className={`text-xs font-medium ${themeColors.text.secondary}`}>{label}</label>

      {normalizedValue.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {normalizedValue.map((tag) => (
            <div
              key={tag}
              className={`inline-flex items-center gap-1 ${themeColors.tag.display} text-xs px-2 py-1 ${themeColors.util.roundedFull} ${themeColors.transition}`}
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className={`${themeColors.text.secondary} ${themeColors.interactive.hoverText} ${themeColors.transition}`}
                aria-label={`Supprimer ${tag}`}
              >
                <ClearIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value);
            setQueryValue(event.target.value);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            suggestionNavigation.resetHighlight();
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' && filteredSuggestions.length > 0) {
              event.preventDefault();
              suggestionNavigation.moveHighlight(1);
              return;
            }

            if (event.key === 'ArrowUp' && filteredSuggestions.length > 0) {
              event.preventDefault();
              suggestionNavigation.moveHighlight(-1);
              return;
            }

            if (event.key === 'Tab') {
              if (filteredSuggestions.length > 0) {
                event.preventDefault();
                const selection = suggestionNavigation.highlightedIndex !== null
                  ? filteredSuggestions[suggestionNavigation.highlightedIndex]
                  : filteredSuggestions[0];
                setInputValue(selection);
                setQueryValue(selection);
                if (suggestionNavigation.highlightedIndex === null) {
                  suggestionNavigation.setHighlightedIndex(0);
                }
              }
              return;
            }

            if (event.key === 'Enter') {
              event.preventDefault();
              addTag(inputValue);
              setQueryValue('');
              return;
            }

            if (event.key === 'Escape') {
              event.preventDefault();
              setInputValue(queryValue);
              suggestionNavigation.resetHighlight();
              return;
            }
          }}
          placeholder={placeholder}
          className={`w-full px-3 py-2 text-sm ${themeColors.input.search} border ${themeColors.util.roundedLg} focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder}`}
        />

        {isFocused && filteredSuggestions.length > 0 && (
          <div className={suggestionDropdownClass}>
            <ul className="py-1">
              {filteredSuggestions.map((tag, index) => (
                <li key={tag}>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      addTag(tag);
                    }}
                    className={`${suggestionOptionClass} px-3 py-1.5 text-sm ${
                      index === suggestionNavigation.highlightedIndex ? themeColors.link : themeColors.text.primary
                    }`}
                    onMouseEnter={() => suggestionNavigation.setHighlightedIndex(index)}
                    aria-selected={index === suggestionNavigation.highlightedIndex}
                  >
                    {tag}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
