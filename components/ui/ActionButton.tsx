import type { ButtonHTMLAttributes } from 'react';
import { themeColors } from '@/lib/theme-colors';

export type ActionButtonVariant =
  | 'dangerFilled'
  | 'dangerOutline'
  | 'neutralOutline'
  | 'primary'
  | 'primaryOutline';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ActionButtonVariant;
}

const enabledVariantClasses: Record<ActionButtonVariant, string> = {
  dangerFilled: themeColors.button.dangerFilled,
  dangerOutline: themeColors.button.dangerOutline,
  neutralOutline: themeColors.button.neutralOutline,
  primary: themeColors.button.primary,
  primaryOutline: themeColors.button.primaryOutline,
};

const disabledVariantClasses: Record<ActionButtonVariant, string> = {
  dangerFilled: themeColors.button.dangerOutlineDisabled,
  dangerOutline: themeColors.button.dangerOutlineDisabled,
  neutralOutline: `${themeColors.button.neutralOutline} cursor-not-allowed opacity-50`,
  primary: themeColors.button.primaryDisabled,
  primaryOutline: themeColors.button.primaryOutlineDisabled,
};

export default function ActionButton({
  className = '',
  disabled = false,
  type = 'button',
  variant,
  ...buttonProps
}: ActionButtonProps) {
  const variantClass = disabled
    ? disabledVariantClasses[variant]
    : enabledVariantClasses[variant];

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${themeColors.button.actionBase} ${variantClass} ${className}`}
      {...buttonProps}
    />
  );
}
