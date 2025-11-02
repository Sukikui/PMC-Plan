/**
 * UI utility functions shared across components
 */

export const getWorldBadge = (world: string): string => {
  const baseClasses = "inline-block text-xs px-2 py-1 rounded-full font-medium transition-colors duration-300";
  if (world === 'overworld') {
    return `${baseClasses} bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300`;
  } else if (world === 'nether') {
    return `${baseClasses} bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300`;
  }
  return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300`;
};

// Version pour InfoOverlay qui utilise text-sm au lieu de text-xs
export const getWorldBadgeLarge = (world: string): string => {
  const baseClasses = "inline-block text-sm px-3 py-1 rounded-full font-medium transition-colors duration-300";
  if (world === 'overworld') {
    return `${baseClasses} bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300`;
  } else if (world === 'nether') {
    return `${baseClasses} bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300`;
  }
  return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300`;
};

export const getItemBadge = (hasCustomName: boolean): string => {
  const baseClasses = "inline-block text-xs px-2 py-1 rounded-full font-medium transition-colors duration-300";
  if (hasCustomName) {
    return `${baseClasses} bg-purple-100 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300`;
  }
  return `${baseClasses} bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300`;
};

// Version pour TradeOverlay qui utilise text-sm au lieu de text-xs
export const getItemBadgeLarge = (hasCustomName: boolean): string => {
  const baseClasses = "inline-block text-sm px-2.5 py-1.5 rounded-xl font-medium transition-colors duration-300";
  if (hasCustomName) {
    return `${baseClasses} bg-purple-100 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300`;
  }
  return `${baseClasses} bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300`;
};