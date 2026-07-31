import {
  useCallback,
  useEffect,
  useState,
} from 'react';

export function useSuggestionHighlight(
  itemCount: number,
  active: boolean,
) {
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!active || itemCount === 0) {
      setHighlightedIndex(null);
      return;
    }
    setHighlightedIndex((current) => (
      current === null || current >= itemCount ? 0 : current
    ));
  }, [active, itemCount]);

  const moveHighlight = useCallback((direction: 1 | -1) => {
    if (itemCount === 0) return;
    setHighlightedIndex((current) => {
      if (current === null) return direction === 1 ? 0 : itemCount - 1;
      return (current + direction + itemCount) % itemCount;
    });
  }, [itemCount]);

  return {
    highlightedIndex,
    setHighlightedIndex,
    moveHighlight,
    resetHighlight: () => setHighlightedIndex(null),
  };
}
