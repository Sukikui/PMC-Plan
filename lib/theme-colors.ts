export const themeColors = {
  // Panel backgrounds - exactement comme dans les panels existants
  panel: {
    primary: 'bg-white/90 dark:bg-gray-900/95',
    secondary: 'bg-white/70 dark:bg-gray-900/70',
    tertiary: 'bg-white/80 dark:bg-gray-900/80',
  },
  
  // Borders - reprises des panels existants
  border: {
    primary: 'border-gray-200/50 dark:border-gray-800/50',
    secondary: 'border-gray-200/70 dark:border-gray-800/95',
    tertiary: 'border-gray-300 dark:border-gray-700',
    quaternary: 'border-gray-300 dark:border-gray-600',
    light: 'border-gray-200/70 dark:border-gray-800/80',
  },

  // Text colors - exactement comme utilisées
  text: {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-600 dark:text-gray-400',
    tertiary: 'text-gray-500 dark:text-gray-400',
    quaternary: 'text-gray-700 dark:text-gray-300',
    muted: 'text-gray-500 dark:text-gray-500',
  },

  // Interactive elements - états hover des panels
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

  // Buttons - tous les types utilisés
  button: {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    secondary: 'bg-white dark:bg-gray-900 hover:bg-white/90 hover:border-gray-300 dark:hover:border-gray-700',
    ghost: 'bg-white dark:bg-transparent text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600',
    round: 'w-12 h-12 rounded-full bg-white dark:bg-gray-900 hover:bg-white/90 hover:border-gray-300 dark:hover:border-gray-700',
  },

  // World badges - PositionPanel et DestinationPanel
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

  // Links - SettingsPanel et DestinationPanel
  link: 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800',

  // Shadows - utilisées partout
  shadow: {
    panel: 'shadow-2xl dark:shadow-black/65',
    button: 'shadow-sm dark:shadow-black/65',
  },

  // Input styles - PositionPanel et DestinationPanel
  input: {
    base: 'bg-white/90 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-800/50 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500',
    search: 'bg-white/70 dark:bg-gray-900/70 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500',
  },

  // Placeholders
  placeholder: 'placeholder-gray-400 dark:placeholder-gray-500',

  // Transitions - utilisée partout
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

  // Couleurs spécifiques pour TravelPlan
  travelPlan: {
    // Icônes de transport
    overworldIcon: 'text-green-600 dark:text-green-400',
    netherIcon: 'text-red-600 dark:text-red-400', 
    portalIcon: 'text-purple-600 dark:text-purple-400',
    portalContainer: 'bg-purple-100 dark:bg-purple-800/40 border-purple-200 dark:border-purple-700',
    
    // États sémantiques
    unknownPortal: 'text-red-700 dark:text-red-300',
    playerPosition: 'text-blue-500 dark:text-blue-400',
    
    // Adresses nether
    netherAddress: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    
    // Icônes d'état dans les écrans vides
    routeIcon: 'text-blue-500 dark:text-blue-400',
    errorIcon: 'text-red-500 dark:text-red-400', 
    positionIcon: 'text-yellow-600 dark:text-yellow-400',
    
    // Spinner de chargement
    spinnerTop: 'border-t-blue-500 dark:border-t-blue-400',
  },

  // Couleurs spécifiques pour SyncNotification 
  syncNotification: {
    // Container de notification d'erreur
    errorBg: 'bg-red-50 dark:bg-red-900/20',
    errorBorder: 'border-red-200 dark:border-red-700',
    
    // Indicateur de status (point rouge)
    statusDot: 'bg-red-500',
    
    // Messages d'erreur
    errorText: 'text-red-700 dark:text-red-300',
    helpText: 'text-red-600 dark:text-red-400',
    
    // Bouton de téléchargement
    downloadBg: 'bg-white/80 dark:bg-gray-800/80',
    downloadHoverBg: 'hover:bg-white dark:hover:bg-gray-700',
    downloadBorder: 'border-red-300 dark:border-red-600',
    downloadHoverBorder: 'hover:border-red-400 dark:hover:border-red-500',
    downloadText: 'text-red-700 dark:text-red-300',
    downloadHoverText: 'hover:text-red-800 dark:hover:text-red-200',
  },

  // Couleurs spécifiques pour BetaLockScreen
  betaLockScreen: {
    // Icône de verrouillage
    lockIcon: 'text-blue-500 dark:text-blue-400',
    
    // Input de mot de passe
    inputBg: 'bg-white/90 dark:bg-gray-800/90',
    inputBorder: 'border-gray-200/50 dark:border-gray-600/50',
    inputFocus: 'focus:ring-blue-500 focus:border-blue-500',
    
    // Bordure de séparation
    separatorBorder: 'border-gray-200/50 dark:border-gray-600/50',
  },

  // Couleurs spécifiques pour InfoOverlay
  infoOverlay: {
    // Description background
    descriptionBg: 'bg-gray-50 dark:bg-gray-800/50',
    
    // Tags des lieux (bleus)
    placeTags: 'bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300',
    
    // Texte d'adresse nether
    netherAddressText: 'text-gray-500 dark:text-gray-400',
  },

  // Couleurs spécifiques pour DestinationPanel
  destinationPanel: {
    // État vide
    emptyStateText: 'text-gray-500',
  },

  // Utility classes couramment utilisées
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