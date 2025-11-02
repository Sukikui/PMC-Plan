import { NextRequest, NextResponse } from 'next/server';

interface Version {
  id: string;
  type: string;
  url: string;
  time: string;
  releaseTime: string;
}

/** Simple in-memory caches for Minecraft data */
const cache = {
  versionJson: new Map<string, Record<string, unknown>>(),     // versionId -> version.json
  lang: new Map<string, Record<string, string>>(),            // `${versionId}:${locale}` -> lang JSON
  blockModels: new Map<string, Record<string, unknown>>(),     // `${versionId}:${blockId}` -> block model JSON
};

/** Fetch JSON from URL with error handling */
async function fetchJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }
  return response.json();
}

/** Get launcher manifest v2 and resolve the chosen version entry */
async function getVersionJson(versionId: string = 'latest') {
  const key = versionId;
  if (cache.versionJson.has(key)) {
    return cache.versionJson.get(key);
  }

  const manifest = await fetchJson('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json') as { latest: { release: string }, versions: Version[] };
  const id = versionId === 'latest' ? manifest.latest.release : versionId;

  const entry = manifest.versions.find((v) => v.id === id);
  if (!entry) {
    throw new Error(`Version not found: ${id}`);
  }

  const versionData = await fetchJson(entry.url);
  cache.versionJson.set(key, versionData);
  return versionData;
}

/** Load and cache a language file using mcasset.cloud */
async function getLang(versionId: string, locale: string) {
  const key = `${versionId}:${locale}`;
  if (cache.lang.has(key)) {
    return cache.lang.get(key);
  }

  const langUrl = `https://assets.mcasset.cloud/${versionId}/assets/minecraft/lang/${locale}.json`;
  const langData = await fetchJson(langUrl);
  cache.lang.set(key, langData);
  return langData;
}

/** Load and cache a block model using mcasset.cloud */
async function getBlockModel(versionId: string, blockId: string) {
  const key = `${versionId}:${blockId}`;
  if (cache.blockModels.has(key)) {
    return cache.blockModels.get(key);
  }

  const modelUrl = `https://assets.mcasset.cloud/${versionId}/assets/minecraft/models/block/${blockId}.json`;
  const modelData = await fetchJson(modelUrl);
  cache.blockModels.set(key, modelData);
  return modelData;
}

/** Resolve texture URLs using mcasset.cloud */
async function resolveTextures(versionId: string, namespacedId: string, lang: Record<string, string>): Promise<string[]> {
  const clean = namespacedId.replace(/^minecraft:/, '');

  // Determine if it's a block or item based on translation availability
  const itemKey = `item.minecraft.${clean}`;
  const blockKey = `block.minecraft.${clean}`;
  const isBlock = lang[blockKey] && !lang[itemKey];

  if (isBlock) {
    // For blocks, get all textures from the model
    try {
      const blockModel = await getBlockModel(versionId, clean) as { textures?: Record<string, string> };
      const textures: string[] = [];
      
      if (blockModel.textures) {
        // Extract all texture references from the model
        for (const [, texturePath] of Object.entries(blockModel.textures)) {
          if (typeof texturePath === 'string') {
            // Convert minecraft:block/texture_name to texture_name
            const textureName = texturePath.replace('minecraft:block/', '');
            const textureUrl = `https://assets.mcasset.cloud/${versionId}/assets/minecraft/textures/block/${textureName}.png`;
            textures.push(textureUrl);
          }
        }
      }
      
      // If no textures found in model, fallback to simple block texture
      if (textures.length === 0) {
        textures.push(`https://assets.mcasset.cloud/${versionId}/assets/minecraft/textures/block/${clean}.png`);
      }
      
      return textures;
    } catch {
      // Fallback to simple block texture if model fetch fails
      return [`https://assets.mcasset.cloud/${versionId}/assets/minecraft/textures/block/${clean}.png`];
    }
  } else {
    // For items, single texture
    return [`https://assets.mcasset.cloud/${versionId}/assets/minecraft/textures/item/${clean}.png`];
  }
}

/** Main endpoint to resolve Minecraft item/block data */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const locale = searchParams.get('lang') || 'fr_fr';
    const version = process.env.MINECRAFT_VERSION || 'latest';

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter (e.g., minecraft:diamond)' }, { status: 400 });
    }

    // Get version info
    const versionData = await getVersionJson(version);
    const actualVersion = versionData.id;

    // Get localized name
    const lang = await getLang(actualVersion, locale);
    const cleanId = id.replace(/^minecraft:/, '');
    
    // Try item translation key first, then block
    const itemKey = `item.minecraft.${cleanId}`;
    const blockKey = `block.minecraft.${cleanId}`;
    const localizedName = lang[itemKey] || lang[blockKey] || null;

    // Get textures
    const textures = await resolveTextures(actualVersion, id, lang);

    // Fallback name if no translation found
    const fallbackName = cleanId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const result = {
      id,
      version: actualVersion,
      name: localizedName || fallbackName,
      textures
    };

    // Set cache headers
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, max-age=86400, immutable');
    return response;

  } catch (error) {
    console.error('Error in MC resolve endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}