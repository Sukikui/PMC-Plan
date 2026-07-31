import type { ReactNode } from 'react';
import { themeColors } from '@/lib/theme-colors';

interface FormSectionProps {
  children: ReactNode;
  className?: string;
  description?: string;
  title: string;
}

export default function FormSection({
  children,
  className = '',
  description,
  title,
}: FormSectionProps) {
  return (
    <section
      className={`space-y-4 border-t pt-5 first:border-t-0 first:pt-0 ${themeColors.border.light} ${className}`}
    >
      <header className="space-y-0.5">
        <h3 className={`text-base font-semibold ${themeColors.text.primary}`}>
          {title}
        </h3>
        {description && (
          <p className={`text-xs leading-relaxed ${themeColors.text.tertiary}`}>
            {description}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}
