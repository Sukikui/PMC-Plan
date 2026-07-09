/**
 * Minecraft Items API client
 * Interfaces with /api/mc/resolve endpoint to get official Minecraft item data
 */

export interface MinecraftItemData {
  id: string;
  version: string;
  name: string;
  kind: 'block' | 'item';
  block?: {
    kind: 'block';
    blockstateKey?: string;
    transform?: { x: number; y: number; uvlock: boolean };
    mesh?: {
      elements: unknown[];
      display: unknown;
      textures: string[];
    };
    multipart?: boolean;
    parts?: unknown[];
    textures?: string[];
    error?: string;
    fallbackTextures?: string[];
  };
  item?: {
    textures: string[];
    glint?: {
      textures: string[];
      animation: unknown;
    };
  };
}

/**
 * Get Minecraft item/block information from our official Mojang API endpoint
 *
 * @param id - Item/Block ID (with or without minecraft: prefix)
 * @param locale - Language locale (default: fr_fr)
 * @returns Promise<MinecraftItemData>
 */
export async function getItemInfo(
  id: string,
  locale: string = 'fr_fr'
): Promise<MinecraftItemData> {
  const params = new URLSearchParams({
    id,
    lang: locale
  });

  const response = await fetch(`/api/mc/resolve?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch item info: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Helper to extract textures from MinecraftItemData regardless of kind
 */
export function getTextures(data: unknown): string[] {
  if (typeof data !== 'object' || data === null) {
    return [];
  }

  // Simple format (current API response): { id, version, name, textures }
  if ('textures' in data && Array.isArray(data.textures)) {
    return data.textures as string[];
  }

  // Complex format (future/alternative): { kind, item: {...}, block: {...} }
  if ('kind' in data) {
    const itemData = data as MinecraftItemData;
    // Items: simple 2D textures
    if (itemData.kind === 'item' && itemData.item?.textures) {
      return itemData.item.textures;
    }

    // Blocks: 3D mesh textures or fallback
    if (itemData.kind === 'block') {
      // Try mesh textures first (3D model)
      if (itemData.block?.mesh?.textures) {
        return itemData.block.mesh.textures;
      }
      // Multipart blocks
      if (itemData.block?.textures) {
        return itemData.block.textures;
      }
      // Fallback if mesh failed to load
      if (itemData.block?.fallbackTextures) {
        return itemData.block.fallbackTextures;
      }
    }
  }

  return [];
}