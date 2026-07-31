import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
} from 'react';
import { themeColors } from '@/lib/theme-colors';

export const listRowClassName = `group border-t py-3 first:border-t-0 ${themeColors.border.primary}`;
export const interactiveListGroupClassName = '[&>button:hover]:border-transparent [&>button:hover+button]:border-transparent';

export function ListRow({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`${listRowClassName} ${className}`}
      {...props}
    />
  );
}

export function ListRowButton({
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`w-full text-left ${listRowClassName} ${themeColors.util.roundedLg} ${themeColors.interactive.listRowHover} ${themeColors.interactive.focusRing} ${themeColors.transitionAll} ${className}`}
      {...props}
    />
  );
}
