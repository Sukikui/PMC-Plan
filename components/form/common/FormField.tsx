import type { ReactNode } from 'react';
import { themeColors } from '@/lib/theme-colors';
import FormFieldLabel from './FormFieldLabel';

interface FormFieldProps {
  children: ReactNode;
  className?: string;
  counter?: {
    current: number;
    max: number;
  };
  label: string;
}

export default function FormField({
  children,
  className = '',
  counter,
  label,
}: FormFieldProps) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="flex items-center justify-between gap-3">
        <FormFieldLabel>{label}</FormFieldLabel>
        {counter && (
          <span className={`text-xs tabular-nums ${themeColors.text.tertiary}`}>
            {counter.current}/{counter.max}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}
