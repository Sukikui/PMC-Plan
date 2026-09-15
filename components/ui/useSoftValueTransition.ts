import { useEffect, useRef, useState } from 'react';

export const SOFT_VALUE_TRANSITION_DURATION_MS = 140;
export const SOFT_PRESENCE_TRANSITION_DURATION_MS = 220;

interface SoftValueTransitionOptions {
  animateInitial?: boolean;
  retainedDurationMs?: number;
}

export function useSoftValueTransition<Value>(
  value: Value | null,
  identity: string | null,
  {
    animateInitial = false,
    retainedDurationMs = 0,
  }: SoftValueTransitionOptions = {},
) {
  const [displayedValue, setDisplayedValue] = useState(value);
  const [contentVisible, setContentVisible] = useState(
    value !== null && !animateInitial,
  );
  const displayedIdentityRef = useRef(identity);
  const displayedValueRef = useRef(value);
  const pendingIdentityRef = useRef(identity);
  const pendingValueRef = useRef(value);
  const initialAnimationPendingRef = useRef(animateInitial && value !== null);
  const present = value !== null;

  pendingIdentityRef.current = identity;
  pendingValueRef.current = value;

  useEffect(() => {
    let frame: number | undefined;

    if (!present) {
      const timer = window.setTimeout(() => {
        if (pendingValueRef.current !== null) return;
        displayedIdentityRef.current = null;
        displayedValueRef.current = null;
        setDisplayedValue(null);
      }, retainedDurationMs);
      return () => window.clearTimeout(timer);
    }

    if (displayedValueRef.current === null) {
      displayedIdentityRef.current = pendingIdentityRef.current;
      displayedValueRef.current = pendingValueRef.current;
      setDisplayedValue(pendingValueRef.current);
      setContentVisible(false);
      frame = window.requestAnimationFrame(() => setContentVisible(true));
      return () => {
        if (frame !== undefined) window.cancelAnimationFrame(frame);
      };
    }

    if (displayedIdentityRef.current === identity) {
      if (initialAnimationPendingRef.current) {
        initialAnimationPendingRef.current = false;
        frame = window.requestAnimationFrame(() => setContentVisible(true));
      } else {
        setContentVisible(true);
      }
      return () => {
        if (frame !== undefined) window.cancelAnimationFrame(frame);
      };
    }

    initialAnimationPendingRef.current = false;
    setContentVisible(false);
    const timer = window.setTimeout(() => {
      const nextValue = pendingValueRef.current;
      if (nextValue === null) return;

      displayedIdentityRef.current = pendingIdentityRef.current;
      displayedValueRef.current = nextValue;
      setDisplayedValue(nextValue);
      frame = window.requestAnimationFrame(() => setContentVisible(true));
    }, SOFT_VALUE_TRANSITION_DURATION_MS);

    return () => {
      window.clearTimeout(timer);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, [identity, present, retainedDurationMs]);

  return {
    contentVisible,
    displayedValue: present && displayedIdentityRef.current === identity
      ? value
      : displayedValue,
    visible: present,
  };
}

export function useSoftPresence(
  present: boolean,
  durationMs = SOFT_PRESENCE_TRANSITION_DURATION_MS,
) {
  const [mounted, setMounted] = useState(present);
  const [visible, setVisible] = useState(present);
  const presentRef = useRef(present);

  presentRef.current = present;

  useEffect(() => {
    if (present) {
      setMounted(true);
      return undefined;
    }

    setVisible(false);
    const timer = window.setTimeout(() => {
      if (!presentRef.current) setMounted(false);
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, present]);

  useEffect(() => {
    if (!mounted || !present) return undefined;

    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, [mounted, present]);

  return { mounted, visible };
}
