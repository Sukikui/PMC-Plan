import React, { useEffect, useMemo, useState } from 'react';
import ClearIcon from '@/components/icons/ClearIcon';
import { themeColors } from '@/lib/theme-colors';

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
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

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

  useEffect(() => {
    if (!isFocused) {
      setHighlightedIndex(null);
      return;
    }
    if (filteredSuggestions.length === 0) {
      setHighlightedIndex(null);
      return;
    }
    setHighlightedIndex((prev) => {
      if (prev === null || prev >= filteredSuggestions.length) {
        return 0;
      }
      return prev;
    });
  }, [filteredSuggestions.length, isFocused]);

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
            setHighlightedIndex(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' && filteredSuggestions.length > 0) {
              event.preventDefault();
              const nextIndex =
                highlightedIndex === null ? 0 : (highlightedIndex + 1) % filteredSuggestions.length;
              setHighlightedIndex(nextIndex);
              return;
            }

            if (event.key === 'ArrowUp' && filteredSuggestions.length > 0) {
              event.preventDefault();
              const nextIndex =
                highlightedIndex === null
                  ? filteredSuggestions.length - 1
                  : (highlightedIndex - 1 + filteredSuggestions.length) % filteredSuggestions.length;
              setHighlightedIndex(nextIndex);
              return;
            }

            if (event.key === 'Tab') {
              if (filteredSuggestions.length > 0) {
                event.preventDefault();
                const selection = highlightedIndex !== null
                  ? filteredSuggestions[highlightedIndex]
                  : filteredSuggestions[0];
                setInputValue(selection);
                setQueryValue(selection);
                if (highlightedIndex === null) {
                  setHighlightedIndex(0);
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
              setHighlightedIndex(null);
              return;
            }
          }}
          placeholder={placeholder}
          className={`w-full px-3 py-2 text-sm ${themeColors.input.search} border ${themeColors.util.roundedLg} focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder}`}
        />

        {isFocused && filteredSuggestions.length > 0 && (
          <div
            className={`absolute left-0 right-0 mt-2 ${themeColors.panel.primary} ${themeColors.blurSm} border ${themeColors.border.primary} ${themeColors.util.roundedLg} ${themeColors.shadow.panel} overflow-hidden z-20`}
          >
            <ul className="py-1">
              {filteredSuggestions.map((tag, index) => (
                <li key={tag}>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      addTag(tag);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-sm ${themeColors.transition} ${themeColors.interactive.hoverPanel} ${
                      index === highlightedIndex ? themeColors.link : themeColors.text.primary
                    }`}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    aria-selected={index === highlightedIndex}
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
