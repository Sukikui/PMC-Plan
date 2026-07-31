import { themeColors } from '@/lib/theme-colors';

export const formInputClassName = `${themeColors.input.search} border ${themeColors.util.roundedLg} px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder}`;

export const formTextareaClassName = `${formInputClassName} form-textarea-resizer`;

export const formFieldLabelClassName = `text-xs font-medium ${themeColors.text.secondary}`;
