// Starlight Skin API - Simplified version  
// Documentation: https://docs.lunareclipse.studio/

// Available render types
export type RenderType = 
  | 'default' | 'marching' | 'walking' | 'crouching' | 'crossed' | 'criss_cross'
  | 'ultimate' | 'isometric' | 'head' | 'custom' | 'cheering' | 'relaxing'
  | 'trudging' | 'cowering' | 'pointing' | 'lunging' | 'dungeons' | 'facepalm'
  | 'sleeping' | 'dead' | 'archer' | 'kicking' | 'mojavatar' | 'reading'
  | 'high_ground' | 'clown' | 'bitzel' | 'pixel' | 'ornament' | 'skin' | 'profile';

// Available crop types
export type RenderCrop = 'full' | 'bust' | 'face' | 'head' | 'default' | 'processed' | 'barebones';

// JSON coordinate structure for lighting positioning
export interface LightPosition {
  x: number;
  y: number;
  z: number;
}

// Render options - only essential parameters
export interface RenderOptions {
  renderType: RenderType;
  crop?: RenderCrop;
  cameraWidth?: number;
  cameraHeight?: number;
  renderScale?: number;
  dropShadow?: boolean;
  borderHighlight?: boolean;
  borderHighlightColor?: string;
  borderHighlightRadius?: number;
  dirLightPos?: LightPosition;
  dirLightColor?: string;
  dirLightIntensity?: number;
  globalLightColor?: string;
  globalLightIntensity?: number;
}

/**
 * Get Starlight Skin render URL - ONE function for everything
 */
export function getRenderUrl(playerIdentifier: string, options: RenderOptions): string {
  const { renderType, crop = 'full', ...params } = options;
  
  const baseUrl = `https://starlightskins.lunareclipse.studio/render/${renderType}/${playerIdentifier}/${crop}`;
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object') {
        // Handle JSON objects like dirLightPos
        searchParams.append(key, JSON.stringify(value));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// Quick shortcuts for common use cases
export const getAvatar = (player: string, size: number = 64): string => 
  getRenderUrl(player, { renderType: 'head', crop: 'head', cameraWidth: size, cameraHeight: size });

export const getBody = (player: string, size: number = 256): string => 
  getRenderUrl(player, { renderType: 'default', crop: 'full', cameraWidth: size, cameraHeight: size });

export const getSkin = (player: string): string => 
  getRenderUrl(player, { renderType: 'skin', crop: 'default' });