# Minecraft Items API

Resolves official Minecraft item/block data using Mojang version resolution and mcasset.cloud for translations and textures.

## Endpoint

```
GET /api/mc/resolve?id=diamond&lang=fr_fr
```

**Parameters:**

- **`id`** (required): Item/block ID (e.g., `minecraft:diamond`, `diamond`)
- **`lang`** (optional): Translation locale (default: `fr_fr`)

## Configuration

Set the **server-side** environment variable `MINECRAFT_VERSION`:

```env
# .env.local (server only)
MINECRAFT_VERSION=1.21.1
```

**Version Resolution:**

- **`latest`**: Resolves to `manifest.latest.release` (variable, e.g., `1.21.8`) - ⚠️ Dev only
- **`1.21.1`**: Uses exact version (always `1.21.1`) - ✅ **Recommended for production**
- **Undefined**: Defaults to `latest` - ⚠️ Not recommended

> **Note:** `latest` changes automatically when Mojang releases new versions. Fixed versions guarantee stable responses and cache consistency.

## Response

**Success (200):**

```json
{
  "id": "minecraft:diamond",
  "version": "1.21.1",
  "name": "Diamant",
  "textures": [
    "https://assets.mcasset.cloud/1.21.1/assets/minecraft/textures/item/diamond.png"
  ]
}
```

**Response Fields:**

- **`id`**: Complete item ID (with namespace)
- **`version`**: Final resolved Minecraft version (may differ from `MINECRAFT_VERSION` if `latest`)
- **`name`**: Localized item name (or formatted fallback)
- **`textures`**: Texture URLs from mcasset.cloud (single texture for items, multiple for blocks)

**Errors:**

```bash
# 400 - Missing parameter
{ "error": "Missing id parameter (e.g., minecraft:diamond)" }

# 500 - Server error  
{ "error": "Internal server error", "details": "Version not found: 1.99.99" }
```

## Examples

```bash
# French diamond
curl "/api/mc/resolve?id=minecraft:diamond&lang=fr_fr"

# English dirt
curl "/api/mc/resolve?id=dirt&lang=en_us"

# Stone block (default French)
curl "/api/mc/resolve?id=minecraft:stone"
```

## Client Usage

```typescript
// Using the utility function (lib/minecraft-items.ts)
import { getItemInfo } from '@/lib/minecraft-items';

// Basic usage
const diamond = await getItemInfo('minecraft:diamond');
console.log(diamond.name);    // "Diamant" 
console.log(diamond.version); // "1.21.1" (resolved version)

// With specific locale
const stone = await getItemInfo('stone', 'en_us');

// React component example
function ItemIcon({ itemId }) {
  const [item, setItem] = useState(null);
  
  useEffect(() => {
    getItemInfo(itemId).then(setItem);
  }, [itemId]);
  
  if (!item) return 'Loading...';
  
  return `<img src="${item.textures[0]}" alt="${item.name}" 
              style="image-rendering: pixelated; width: 16px; height: 16px">`;
}

// Trading system integration
const tradeItem = { item_id: "minecraft:diamond", quantity: 5, custom_name: "Magic Diamond" };
const itemInfo = await getItemInfo(tradeItem.item_id);
const displayName = tradeItem.custom_name || itemInfo.name;
```

## Performance & Caching

- **Memory cache**: Version manifests, language files, and block models cached server-side
- **HTTP cache**: 24h response caching via `Cache-Control: public, max-age=86400, immutable`
- **External assets**: All translations and textures served from mcasset.cloud CDN

## Data Sources & Strategy

**Primary Sources:**
1. **Version Manifest**: `https://piston-meta.mojang.com/mc/game/version_manifest_v2.json` (Mojang official)
2. **Languages**: `https://assets.mcasset.cloud/{version}/assets/minecraft/lang/{locale}.json`
3. **Item Textures**: `https://assets.mcasset.cloud/{version}/assets/minecraft/textures/item/{item}.png`
4. **Block Models**: `https://assets.mcasset.cloud/{version}/assets/minecraft/models/block/{block}.json`
5. **Block Textures**: `https://assets.mcasset.cloud/{version}/assets/minecraft/textures/block/{texture}.png`

**Texture Resolution Strategy:**
1. **Items**: Direct texture URL from mcasset.cloud
2. **Blocks**: Fetch block model JSON to get all texture references (top, side, end, etc.)
3. **Fallback**: Simple texture URL if model fetch fails

**Limitations:**
- Java Edition only
- Dependency on mcasset.cloud service availability
- No locale fallbacks (exact locale required)
- Formatted name fallback if translation missing
- Very recent versions may not be immediately available on mcasset.cloud

## Architecture

**Version Resolution Flow:**
```
MINECRAFT_VERSION → ["latest" → Mojang API → manifest.latest.release] or ["1.21.1" → Fixed Version]
                   ↓
              Final Version (e.g., "1.21.8" or "1.21.1")
                   ↓
              Asset Index + Language Files
```

**API Processing Flow:**
```
1. Client Request → /api/mc/resolve?id=ancient_debris&lang=fr_fr
2. Version Resolution → MINECRAFT_VERSION or "latest" (Mojang API)
3. Language Fetch → mcasset.cloud/{version}/lang/fr_fr.json
4. Item/Block Detection → Check translation keys
5. Texture Resolution → 
   - Items: Single texture from mcasset.cloud
   - Blocks: Model JSON + all referenced textures
6. Response → JSON with final version + localized data + all textures
```

**Caching Strategy:**
- **Version cache**: `cache.versionJson.set(versionId, data)`
- **Language cache**: `cache.lang.set('1.21.1:fr_fr', langData)`  
- **Block model cache**: `cache.blockModels.set('1.21.1:ancient_debris', modelData)`
- **HTTP TTL**: 24h client cache (`max-age=86400`)

*Combines official Mojang version resolution with mcasset.cloud asset delivery.*