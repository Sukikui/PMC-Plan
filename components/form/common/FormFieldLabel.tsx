import type { ReactNode } from 'react';
import { formFieldLabelClassName } from './form-styles';

interface FormFieldLabelProps {
  children: ReactNode;
  className?: string;
}

export default function FormFieldLabel({
  children,
  className = '',
}: FormFieldLabelProps) {
  return (
    <span className={`${formFieldLabelClassName} ${className}`}>
      {children}
    </span>
  );
}
