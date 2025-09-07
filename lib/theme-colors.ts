export const themeColors = {
  // Simplified background system - base color IDENTICAL to panels
  background: {
    // BetaLockScreen - gradient with accentuated blue shades consistent with noDestination
    lockScreen: 'bg-gradient-to-br from-blue-100 via-white to-indigo-100 dark:from-blue-950/20 dark:via-gray-900 dark:to-indigo-950/20',
  },

  // Main screen backgrounds by state - base identical to panels
  mainScreen: {
    // State 1: No destination selected - accentuated blue shades like BetaLockScreen
    noDestination: 'bg-gradient-to-br from-blue-100 via-white to-indigo-100 dark:from-blue-950/20 dark:via-gray-900 dark:to-indigo-950/20',
    
    // State 2: Destination selected but no position (also loading) - dark yellow shades
    noPosition: 'bg-gradient-to-br from-yellow-50 via-white to-orange-50 dark:from-yellow-950/15 dark:via-gray-900 dark:to-orange-950/15',
    
    // State 3: Route calculated and displayed - dark green shades
    routeActive: 'bg-gradient-to-br from-green-50 via-white to-green-100 dark:from-green-950/15 dark:via-gray-900 dark:to-green-900/20',
    
    // Error state - dark red shades
    error: 'bg-gradient-to-br from-red-50 via-white to-pink-50 dark:from-red-950/15 dark:via-gray-900 dark:to-pink-950/15',
  },

  // Centralized UI elements
  ui: {
    // Icon container (BetaLockScreen + generic TravelPlan icons)
    iconContainer: 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 dark:bg-gray-800',
    
    // Specific container for the position icon (yellow/orange)
    positionIconContainer: 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 dark:bg-gray-800',
    
    // Specific container for the error icon (red)
    errorIconContainer: 'bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 dark:bg-gray-800',
    
    // Connector between steps
    stepConnector: 'bg-gradient-to-b from-gray-300 to-gray-300 dark:from-gray-600 dark:to-gray-600',
    
    // Overlay backdrop
    overlayBackdrop: 'bg-black/20 dark:bg-black/40',
  },

  // Panel backgrounds - consistent with the main background
  panel: {
    primary: 'bg-white/90 dark:bg-gray-900/95',
    secondary: 'bg-white/70 dark:bg-gray-900/70',
    tertiary: 'bg-white/80 dark:bg-gray-900/80',
  },
  
  // Borders - reused from existing panels
  border: {
    primary: 'border-gray-200/50 dark:border-gray-800/50',
    secondary: 'border-gray-200/70 dark:border-gray-800/95',
    tertiary: 'border-gray-300 dark:border-gray-700',
    quaternary: 'border-gray-300 dark:border-gray-600',
    light: 'border-gray-200/70 dark:border-gray-800/80',
  },

  // Text colors - exactly as used
  text: {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-600 dark:text-gray-400',
    tertiary: 'text-gray-500 dark:text-gray-400',
    quaternary: 'text-gray-700 dark:text-gray-300',
    muted: 'text-gray-500 dark:text-gray-500',
  },

  // Interactive elements - hover states for panels
  interactive: {
    hover: 'hover:bg-gray-50 dark:hover:bg-gray-600',
    hoverPanel: 'hover:bg-white/90 dark:hover:bg-gray-900/90',
    hoverBorder: 'hover:border-gray-300 dark:hover:border-gray-700',
    hoverText: 'hover:text-gray-600 dark:hover:text-gray-300',
    groupHoverText: 'group-hover:text-gray-700 dark:group-hover:text-gray-300',
    disabled: 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  },

  // Status indicators - PositionPanel
  status: {
    connected: 'bg-blue-500',
    disconnected: 'bg-red-500',
  },

  // Buttons - all types used
  button: {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    secondary: 'bg-white dark:bg-gray-900 hover:bg-white/90 hover:border-gray-300 dark:hover:border-gray-700',
    ghost: 'bg-white dark:bg-transparent text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600',
    round: 'w-12 h-12 rounded-full bg-white dark:bg-gray-900 hover:bg-white/90 hover:border-gray-300 dark:hover:border-gray-700',
  },

  // World badges - PositionPanel and DestinationPanel
  world: {
    overworld: 'bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300 border border-green-100 dark:border-transparent',
    nether: 'bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-transparent',
  },

  // Theme selector - SettingsPanel
  theme: {
    light: 'bg-yellow-100 dark:bg-yellow-800/30 text-yellow-700 dark:text-yellow-300 border border-yellow-100 dark:border-transparent',
    dark: 'bg-gray-100 dark:bg-indigo-800/50 text-gray-700 dark:text-indigo-100 border border-gray-100 dark:border-transparent',
    system: 'bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-200 border border-blue-100 dark:border-transparent',
  },

  // Selection states - DestinationPanel
  selection: {
    place: {
      active: 'bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-700',
      hover: 'hover:[box-shadow:0_0_15px_0_var(--tw-shadow-color)] hover:shadow-blue-400/75 dark:hover:shadow-blue-700/50',
    },
    portal: {
      active: 'bg-purple-100 dark:bg-purple-900/20 border-2 border-purple-400 dark:border-purple-700',
      hover: 'hover:[box-shadow:0_0_15px_0_var(--tw-shadow-color)] hover:shadow-purple-400/75 dark:hover:shadow-purple-700/50',
    },
  },

  // Tags - DestinationPanel
  tag: {
    active: 'bg-blue-500 text-white border-blue-500',
    inactive: 'bg-white dark:bg-transparent text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600',
    display: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    filterLogic: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700',
  },

  // Links - SettingsPanel and DestinationPanel
  link: 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800',

  // Shadows - used everywhere
  shadow: {
    panel: 'shadow-2xl dark:shadow-black/65',
    button: 'shadow-sm dark:shadow-black/65',
    overlay: {
      place: 'shadow-blue-400/75 dark:shadow-blue-700/50',
      portal: 'shadow-purple-400/75 dark:shadow-purple-700/50',
    }
  },

  // Input styles - PositionPanel and DestinationPanel
  input: {
    base: 'bg-white/90 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-800/50 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500',
    search: 'bg-white/70 dark:bg-gray-900/70 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500',
  },

  // Placeholders
  placeholder: 'placeholder-gray-400 dark:placeholder-gray-500',

  // Transitions - used everywhere
  transition: 'transition-colors duration-300',
  transitionAll: 'transition-all duration-300',

  // Blur effects  
  blur: 'backdrop-blur-md',
  blurSm: 'backdrop-blur-sm',

  // Gradients for scroll effects - DestinationPanel
  gradient: {
    topSolid: 'bg-white/90 dark:bg-gray-900/95',
    topBlur: 'bg-gradient-to-b from-white/90 dark:from-gray-900/95 via-white/80 dark:via-gray-900/80 to-transparent',
    bottomSolid: 'bg-white dark:bg-gray-900',
    bottomBlur: 'bg-gradient-to-t from-white dark:from-gray-900 via-white/90 dark:via-gray-900/90 to-transparent',
  },

  // Specific colors for TravelPlan
  travelPlan: {
    // Transport icons
    overworldIcon: 'text-green-600 dark:text-green-400',
    netherIcon: 'text-red-600 dark:text-red-400', 
    portalIcon: 'text-purple-600 dark:text-purple-400',
    portalContainer: 'bg-purple-100 dark:bg-purple-800/40 border-purple-200 dark:border-purple-700',
    
    // Semantic states
    unknownPortal: 'text-red-700 dark:text-red-300',
    playerPosition: 'text-blue-500 dark:text-blue-400',
    
    // Nether addresses
    netherAddress: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    
    // Status icons in empty screens
    routeIcon: 'text-blue-500 dark:text-blue-400',
    errorIcon: 'text-red-500 dark:text-red-400', 
    positionIcon: 'text-yellow-600 dark:text-yellow-400',
    
    // Loading spinner
    spinnerTop: 'border-t-blue-500 dark:border-t-blue-400',
  },

  // Specific colors for SyncNotification 
  syncNotification: {
    // Error notification container - improved contrast for dark mode
    errorBg: 'bg-red-50 dark:bg-red-950/40',
    errorBorder: 'border-red-200 dark:border-red-800/60',
    
    // Status indicator (red dot) - more visible in dark mode
    statusDot: 'bg-red-500 dark:bg-red-400',
    
    // Error messages - better contrast in dark mode
    errorText: 'text-red-700 dark:text-red-200',
    helpText: 'text-red-600 dark:text-red-300',
    
    // Download button - consistent with other buttons
    downloadBg: 'bg-white/90 dark:bg-gray-900/90',
    downloadHoverBg: 'hover:bg-white dark:hover:bg-gray-800/90',
    downloadBorder: 'border-red-300 dark:border-red-700/50',
    downloadHoverBorder: 'hover:border-red-400 dark:hover:border-red-600',
    downloadText: 'text-red-700 dark:text-red-200',
    downloadHoverText: 'hover:text-red-800 dark:hover:text-red-100',
  },

  // Specific colors for BetaLockScreen
  betaLockScreen: {
    // Lock icon
    lockIcon: 'text-blue-500 dark:text-blue-400',
    
    // Password input
    inputBg: 'bg-white/90 dark:bg-gray-800/90',
    inputBorder: 'border-gray-200/50 dark:border-gray-600/50',
    inputFocus: 'focus:ring-blue-500 focus:border-blue-500',
    
    // Separator border
    separatorBorder: 'border-gray-200/50 dark:border-gray-600/50',
  },

  // Specific colors for InfoOverlay
  infoOverlay: {
    // Description background
    descriptionBg: 'bg-gray-50 dark:bg-gray-800/50',
    
    // Place tags (blue)
    placeTags: 'bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300',
    
    // Nether address text
    netherAddressText: 'text-gray-500 dark:text-gray-400',
  },

  // Specific colors for DestinationPanel
  destinationPanel: {
    // Empty state
    emptyStateText: 'text-gray-500',
  },

  // Commonly used utility classes
  util: {
    roundedXl: 'rounded-xl',
    roundedLg: 'rounded-lg',
    roundedFull: 'rounded-full',
    activeScale: 'active:scale-95',
    hoverScale: 'hover:scale-110',
    animatePulse: 'animate-pulse',
    animateSpin: 'animate-spin',
    uppercase: 'uppercase tracking-wide',
  },
} as const;

export type ThemeColors = typeof themeColors;