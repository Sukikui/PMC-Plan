export const loadFormOverlay = () => import('@/components/form/FormOverlay');

export const loadGlobalTradeOverlay = () => import('@/components/GlobalTradeOverlay');

export const loadInfoOverlayStack = () => import('@/components/overlay/InfoOverlayStack');

export const loadMinecraftLinkOverlay = () => (
  import('@/components/settings/MinecraftLinkOverlay')
);

export const loadSettingsOverlay = () => (
  import('@/components/settings/overlay/SettingsOverlay')
);

export const loadSpaceExplorerOverlay = () => (
  import('@/components/spaces/SpaceExplorerOverlay')
);

export const preloadOverlayModules = async () => {
  await Promise.all([
    loadFormOverlay(),
    loadGlobalTradeOverlay(),
    loadInfoOverlayStack(),
    loadMinecraftLinkOverlay(),
    loadSettingsOverlay(),
    loadSpaceExplorerOverlay(),
  ]);
};
