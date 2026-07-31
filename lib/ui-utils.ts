// Larger item badge variant used in detailed trade views.
export const getItemBadgeLarge = (
  hasCustomName: boolean,
  compactText = false,
): string => {
  const textClass = compactText ? 'text-[13px]' : 'text-sm';
  const baseClasses = `inline-block ${textClass} px-2.5 py-1.5 rounded-xl font-medium transition-colors duration-300`;
  if (hasCustomName) {
    return `${baseClasses} bg-purple-100 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300`;
  }
  return `${baseClasses} bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300`;
};
