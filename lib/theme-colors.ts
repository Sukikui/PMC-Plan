const placeSelectionOutline = 'border-2 !border-blue-400 dark:!border-blue-700';
const formOptionColors = {
  active: 'bg-blue-100/50 text-blue-700 border-blue-200 dark:bg-blue-950/45 dark:text-blue-200 dark:border-blue-500/45',
  inactive: 'bg-gray-100/30 text-gray-700 border-gray-200 hover:bg-gray-200/40 hover:border-gray-300 dark:bg-gray-800/35 dark:text-gray-300 dark:border-gray-700/70 dark:hover:bg-gray-800/70 dark:hover:border-gray-600',
};
const linkedWorldColors =
  'bg-purple-100/50 dark:bg-purple-800/20 text-purple-700 dark:text-purple-300';

export const themeColors = {
  // Simplified background system - base color IDENTICAL to panels
  background: {
    app: 'bg-gray-50 dark:bg-gray-950',
    // BetaLockScreen - gradient with accentuated blue shades consistent with noDestination
    lockScreen: 'bg-gradient-to-br from-blue-100 via-white to-indigo-100 dark:from-blue-950/20 dark:via-gray-900 dark:to-indigo-950/20',
  },

  // Main screen background
  mainScreen: {
    noDestination: 'bg-gradient-to-br from-blue-200 via-sky-50 to-indigo-200 dark:from-blue-950/45 dark:via-slate-900 dark:to-indigo-950/50',
  },

  // Centralized UI elements
  ui: {
    // Icon container (BetaLockScreen + StartupScreen)
    iconContainer: 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 dark:bg-gray-800',
    
    // Connector between steps
    stepConnector: 'bg-gradient-to-b from-gray-300 to-gray-300 dark:from-gray-600 dark:to-gray-600',
    stepConnectorStroke: 'text-gray-300 dark:text-gray-600',
    
    // Overlay backdrop
    overlayBackdrop: 'bg-black/20 dark:bg-black/40',
  },

  // Panel backgrounds - consistent with the main background
  panel: {
    primary: 'bg-white/90 dark:bg-gray-900/95',
    inset: 'bg-white/35 dark:bg-gray-800/25',
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
    accent: 'text-blue-500 dark:text-blue-400',
  },

  identity: {
    unlinked: 'text-gray-400 dark:text-gray-500',
  },

  // Interactive elements - hover states for panels
  interactive: {
    hover: 'hover:bg-gray-50 dark:hover:bg-gray-600',
    listRowHover: 'hover:bg-gray-100/80 dark:hover:bg-gray-700/35',
    hoverPanel: 'hover:bg-white/90 dark:hover:bg-gray-900/90',
    hoverBorder: 'hover:border-gray-300 dark:hover:border-gray-700',
    highlightedPanel: 'bg-white/90 dark:bg-gray-900/90',
    highlightedBorder: 'border-gray-300 dark:border-gray-700',
    hoverText: 'hover:text-gray-600 dark:hover:text-gray-300',
    hoverAccentText: 'hover:text-blue-500 dark:hover:text-blue-400',
    groupHoverText: 'group-hover:text-gray-700 dark:group-hover:text-gray-300',
    groupHoverAccentText: 'group-hover:text-blue-500 dark:group-hover:text-blue-400',
    scopedGroupHoverAccentText: 'group-hover/interactive:text-blue-500 dark:group-hover/interactive:text-blue-400',
    disabled: 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
    focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400',
  },

  // Status indicators - PositionPanel
  status: {
    connected: 'bg-blue-500',
    disconnected: 'bg-red-500',
    success: 'bg-green-500 dark:bg-green-400',
    warning: 'bg-amber-500 dark:bg-amber-400',
  },

  positionPanel: {
    playerSkinGlow: 'drop-shadow-[0_0_6px_rgb(59_130_246_/_0.35)]',
  },

  minecraftLinkTimeline: {
    track: 'bg-gray-200/70 dark:bg-gray-800/80',
    progress: 'bg-blue-400 dark:bg-blue-500',
    idleNode: 'border-gray-300 bg-white/70 text-gray-500 dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-400',
    activeNode: 'border-blue-500 bg-blue-100 text-blue-700 dark:border-blue-500 dark:bg-blue-800/40 dark:text-blue-200',
    completedNode: 'border-blue-400 bg-blue-100/70 text-blue-600 dark:border-blue-600 dark:bg-blue-900/35 dark:text-blue-300',
    actionNode: 'border-blue-500 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:border-blue-500 dark:bg-blue-800/40 dark:text-blue-200 dark:hover:bg-blue-800/60',
    retryActionNode: 'border-red-400 bg-red-100/60 text-red-700 hover:bg-red-200/60 dark:border-red-500 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50',
  },

  adminMode: {
    user: 'bg-blue-100/60 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300',
    superAdmin: 'bg-rose-100/70 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  },

  adminUser: {
    deleteAction: 'text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400',
  },

  // Buttons - all types used
  button: {
    actionBase: 'rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 active:scale-95',
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    primaryOutline: 'border border-blue-300 bg-transparent text-blue-600 hover:border-blue-400 hover:bg-blue-50/60 dark:border-blue-600 dark:text-blue-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/20',
    primaryOutlineDisabled: 'cursor-not-allowed border border-blue-200 bg-transparent text-blue-300 dark:border-blue-900/70 dark:text-blue-700',
    primaryDisabled: 'bg-blue-400 text-white cursor-not-allowed',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    dangerFilled: 'border border-red-500 bg-red-500 text-white hover:border-red-600 hover:bg-red-600 dark:border-red-500 dark:bg-red-500 dark:hover:border-red-400 dark:hover:bg-red-400',
    dangerOutline: 'border border-red-300 bg-transparent text-red-600 hover:border-red-400 hover:bg-red-50/60 dark:border-red-600 dark:text-red-300 dark:hover:border-red-500 dark:hover:bg-red-900/20',
    dangerOutlineDisabled: 'cursor-not-allowed border border-red-200 bg-transparent text-red-300 dark:border-red-900/70 dark:text-red-700',
    neutralOutline: 'border border-gray-300 bg-transparent text-gray-700 hover:border-blue-400 hover:bg-blue-100/20 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:bg-blue-500/10',
    secondary: 'bg-white dark:bg-gray-900 hover:bg-white/90 hover:border-gray-300 dark:hover:border-gray-700',
    ghost: 'bg-white dark:bg-transparent text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600',
    round: 'w-12 h-12 rounded-full',
    iconAction: 'p-1 bg-white dark:bg-gray-900 hover:bg-white/90',
  },

  toggle: {
    base: 'px-3 py-1 text-sm rounded-full font-medium transition-colors duration-300',
    compactBase: 'px-3 py-1 text-xs rounded-full font-medium transition-colors duration-300',
    inactive: 'bg-gray-100/30 dark:bg-gray-700/15 text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-600/20',
    activeBlue: 'bg-blue-100/50 dark:bg-blue-800/20 text-blue-700 dark:text-blue-300',
    activePurple: linkedWorldColors,
    activePurpleStrong: 'bg-purple-100/60 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
    inactiveStrong: 'bg-gray-100/30 dark:bg-gray-700/15 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200/40 dark:hover:bg-gray-600/20',
  },

  // World badges - PositionPanel and DestinationPanel
  world: {
    overworld: 'bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300 border border-green-100 dark:border-transparent',
    nether: 'bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-transparent',
    linked: linkedWorldColors,
    unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  },

  // World-specific inline text colors
  worldText: {
    overworld: 'text-green-700 dark:text-green-300',
    nether: 'text-red-700 dark:text-red-300',
    unknown: 'text-gray-500 dark:text-gray-400',
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
      active: `bg-blue-100 dark:bg-blue-900/20 ${placeSelectionOutline}`,
      hover: 'hover:[box-shadow:0_0_15px_0_var(--tw-shadow-color)] hover:shadow-blue-400/75 dark:hover:shadow-blue-700/50',
      halo: '[box-shadow:0_0_15px_0_var(--tw-shadow-color)] shadow-blue-400/75 dark:shadow-blue-700/50',
    },
    portal: {
      active: 'bg-purple-100 dark:bg-purple-900/20 border-2 border-purple-400 dark:border-purple-700',
      hover: 'hover:[box-shadow:0_0_15px_0_var(--tw-shadow-color)] hover:shadow-purple-400/75 dark:hover:shadow-purple-700/50',
      halo: '[box-shadow:0_0_15px_0_var(--tw-shadow-color)] shadow-purple-400/75 dark:shadow-purple-700/50',
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
    roundButton: '[box-shadow:0_8px_25px_rgba(0,0,0,0.15)] dark:[box-shadow:0_8px_25px_rgba(0,0,0,0.4)]',
    roundButtonCompact: '[box-shadow:0_3px_10px_rgba(0,0,0,0.14)] dark:[box-shadow:0_3px_10px_rgba(0,0,0,0.32)]',
    overlay: {
      place: 'shadow-blue-400/75 dark:shadow-blue-700/50',
      portal: 'shadow-purple-400/75 dark:shadow-purple-700/50',
    }
  },

  // Input styles - PositionPanel and DestinationPanel
  input: {
    base: 'bg-white/90 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-800/50 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500',
    panel: 'bg-transparent border-gray-300/80 dark:border-gray-700/80 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500',
    search: 'bg-white/70 dark:bg-gray-900/70 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500',
  },

  // Form-specific controls
  form: {
    dashedAction: 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white/30 dark:bg-gray-900/70 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100/20 dark:hover:bg-blue-500/10',
    colorRange: '[--color-range-accent:rgb(59_130_246_/_0.8)] [--color-range-accent-solid:rgb(59_130_246)] [--color-range-neutral:rgb(17_24_39_/_0.14)] [--color-range-edge:rgb(17_24_39_/_0.2)] [--color-range-handle:rgb(255_255_255_/_0.52)] [--color-range-handle-border:rgb(17_24_39_/_0.42)] [--color-range-focus:rgb(59_130_246_/_0.45)] dark:[--color-range-accent:rgb(96_165_250_/_0.8)] dark:[--color-range-accent-solid:rgb(96_165_250)] dark:[--color-range-neutral:rgb(255_255_255_/_0.16)] dark:[--color-range-edge:rgb(255_255_255_/_0.22)] dark:[--color-range-handle:rgb(17_24_39_/_0.52)] dark:[--color-range-handle-border:rgb(255_255_255_/_0.42)] dark:[--color-range-focus:rgb(96_165_250_/_0.5)]',
    imageThumbnailInactive: formOptionColors.inactive,
    categoryOption: {
      active: formOptionColors.active,
      inactive: formOptionColors.inactive,
      iconActive: 'bg-white/80 border-blue-200/70 dark:bg-gray-950/30 dark:border-blue-500/35',
      iconInactive: 'bg-white/70 border-gray-200/70 dark:bg-gray-950/30 dark:border-gray-700/70',
    },
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
    topSolidBlur: 'bg-gradient-to-b from-white dark:from-gray-900 from-0% via-white dark:via-gray-900 via-30% via-white/70 dark:via-gray-900/70 via-50% via-white/30 dark:via-gray-900/30 via-75% to-transparent',
    bottomSolid: 'bg-white dark:bg-gray-900',
    bottomBlur: 'bg-gradient-to-t from-white dark:from-gray-900 via-white/90 dark:via-gray-900/90 to-transparent',
  },

  // Generic feedback colors
  feedback: {
    errorText: 'text-red-500 dark:text-red-400',
  },

  // Route preview colors
  routePreview: {
    unknownPortal: 'text-red-700 dark:text-red-300',
    playerPosition: 'text-blue-500 dark:text-blue-400',
    netherAddress: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    mapStepActive: `${placeSelectionOutline} text-blue-700 dark:text-blue-200 hover:!scale-100`,
    mapStepInactive: 'text-gray-600 dark:text-gray-300',
  },

  statusNotification: {
    error: {
      background: 'bg-red-50 dark:bg-red-950',
      border: 'border-red-200 dark:border-red-800/60',
      dot: 'bg-red-500 dark:bg-red-400',
      title: 'text-red-700 dark:text-red-200',
      description: 'text-red-600 dark:text-red-300',
    },
    info: {
      dot: 'bg-blue-500 dark:bg-blue-400',
      title: 'text-blue-700 dark:text-blue-200',
      description: 'text-blue-600 dark:text-blue-300',
    },
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

    // Place image carousel
    imageFrame: 'bg-transparent',
    imageDotActive: 'bg-blue-500 dark:bg-blue-400',
    imageDotInactive: 'bg-gray-300 dark:bg-gray-600 hover:bg-blue-300 dark:hover:bg-blue-500',
  },

  trade: {
    itemQuantity: 'text-white [-webkit-text-stroke:3.5px_rgba(0,0,0,0.7)] [paint-order:stroke_fill]',
  },

  // Map panel
  map: {
    point: 'bg-blue-500',
    pointBorder: 'border-white/60',
    blockGridStroke: 'rgba(255, 255, 255, 0.16)',
    routeLineStroke: 'rgb(59, 130, 246)',
    routeGlowStroke: 'rgb(255, 255, 255)',
    transitionLineStroke: 'rgb(168, 85, 247)',
    transitionLineOpacity: 0.48,
    edgeHalo: {
      overworld: 'border-2 border-white [box-shadow:0_0_42px_10px_var(--tw-shadow-color)] shadow-green-500/35 dark:shadow-green-400/25',
      nether: 'border-2 border-white [box-shadow:0_0_42px_10px_var(--tw-shadow-color)] shadow-red-500/35 dark:shadow-red-400/25',
    },
    tooltip: 'bg-blue-100/75 dark:bg-blue-900/75 text-blue-700 dark:text-blue-100',
    tooltipPreview: 'shadow-xl ring-1 ring-blue-200/70 dark:ring-blue-400/30',
    tooltipPreviewImageFrame: 'ring-1 ring-white/60 dark:ring-white/15',
    tooltipPreviewImageShadow: '[filter:drop-shadow(0_0_18px_rgba(15,23,42,0.36))] dark:[filter:drop-shadow(0_0_20px_rgba(0,0,0,0.58))]',
  },

  // Admin bubble
  adminBubble: {
    background: 'bg-blue-100/40 dark:bg-blue-800/40',
    text: 'text-blue-700 dark:text-blue-300',
    profileCard: 'bg-blue-100/20 dark:bg-blue-800/20',
    badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  },

  // Commonly used utility classes
  util: {
    rounded2Xl: 'rounded-2xl',
    roundedXl: 'rounded-xl',
    roundedLg: 'rounded-lg',
    roundedSm: 'rounded-[3px]',
    roundedFull: 'rounded-full',
    activeScale: 'active:scale-95',
    hoverScale: 'hover:scale-110',
    animatePulse: 'animate-pulse',
    animateSpin: 'animate-spin',
    uppercase: 'uppercase tracking-wide',
  },
} as const;
