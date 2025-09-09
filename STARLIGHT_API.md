# Starlight Skin API 🎨

> **Simple integration for high-quality Minecraft skin rendering in PMC Plan**

## 🚀 Quick Start

```typescript
import { getRenderUrl, getAvatar, getBody } from '@/lib/starlight-skin-api';

// Custom render with full control
const url = getRenderUrl('Notch', {
  renderType: 'ultimate',
  crop: 'face',
  borderHighlight: true,
  borderHighlightRadius: 10
});

// Quick shortcuts
const avatar = getAvatar('Notch', 128);
const body = getBody('Notch', 512);
```

## 📖 API Reference

### `getRenderUrl(player, options)`

**Main function - does everything you need.**

```typescript
getRenderUrl(playerIdentifier: string, options: RenderOptions): string
```

**Example:**
```typescript
const url = getRenderUrl('_Suki_', {
  renderType: 'ultimate',
  crop: 'face',
  cameraWidth: 256,
  dropShadow: true,
  borderHighlight: true,
  borderHighlightColor: 'ff6b6b'
});
// Returns: https://starlightskins.lunareclipse.studio/render/ultimate/_Suki_/face?cameraWidth=256&dropShadow=true&borderHighlight=true&borderHighlightColor=ff6b6b
```

### Quick Shortcuts

```typescript
getAvatar(player: string, size?: number): string    // Default size: 64
getBody(player: string, size?: number): string      // Default size: 256  
getSkin(player: string): string                     // Raw skin texture
```

## ⚙️ Parameters

### `RenderOptions`

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `renderType` | `RenderType` | **Required.** Pose/render type | `'ultimate'` |
| `crop` | `RenderCrop` | Image crop | `'face'` |
| `cameraWidth` | `number` | Image width (max 3840) | `512` |
| `cameraHeight` | `number` | Image height (max 3840) | `512` |
| `renderScale` | `number` | Scale multiplier | `2` |
| `dropShadow` | `boolean` | Add drop shadow | `true` |
| `borderHighlight` | `boolean` | Add border glow | `true` |
| `borderHighlightColor` | `string` | Border color (hex) | `'4f46e5'` |
| `borderHighlightRadius` | `number` | Border radius | `10` |
| `dirLightColor` | `string` | Directional light color | `'ffffff'` |
| `dirLightIntensity` | `number` | Light intensity | `0.5` |
| `globalLightColor` | `string` | Ambient light color | `'1f2937'` |
| `globalLightIntensity` | `number` | Ambient intensity | `-0.2` |

### Render Types

| Type | Use Case | Type | Use Case |
|------|----------|------|----------|
| `default` | General purpose | `cheering` | Victory scenes |
| `ultimate` | Profile pictures | `relaxing` | Calm poses |
| `head` | Avatars only | `dungeons` | Combat ready |
| `isometric` | Thumbnails | `marching` | Action scenes |
| `crossed` | Confident pose | `pointing` | Interactive |
| `walking` | Dynamic | `crouching` | Stealth |

**All types:** `default` `marching` `walking` `crouching` `crossed` `criss_cross` `ultimate` `isometric` `head` `custom` `cheering` `relaxing` `trudging` `cowering` `pointing` `lunging` `dungeons` `facepalm` `sleeping` `dead` `archer` `kicking` `mojavatar` `reading` `high_ground` `clown` `bitzel` `pixel` `ornament` `skin` `profile`

### Crop Types

| Crop | Description |
|------|-------------|
| `full` | Complete render |
| `bust` | Upper body |
| `face` | Face close-up |
| `head` | Head and neck |
| `default` | Default crop |
| `processed` | Processed skin |
| `barebones` | Minimal skin |

## 🔧 Usage Examples

### Basic Integration

```typescript
// Replace Crafatar avatars
function PlayerAvatar({ uuid, size = 64 }) {
  const url = getAvatar(uuid, size);
  return <img src={url} alt="Avatar" className="rounded" />;
}
```

### Custom Renders

```typescript
// Profile render with effects
const profileUrl = getRenderUrl('Notch', {
  renderType: 'ultimate',
  crop: 'bust',
  cameraWidth: 400,
  cameraHeight: 500,
  dropShadow: true,
  borderHighlight: true,
  borderHighlightColor: '4f46e5'
});

// Themed render (light/dark mode)
const themedUrl = getRenderUrl('Notch', {
  renderType: 'cheering',
  crop: 'full',
  globalLightColor: isDark ? '1f2937' : 'ffffff',
  globalLightIntensity: isDark ? -0.3 : 0.1
});

// High-res render
const highResUrl = getRenderUrl('Notch', {
  renderType: 'ultimate',
  crop: 'full',
  cameraWidth: 1024,
  cameraHeight: 1024,
  renderScale: 2
});
```

### Error Handling

```typescript
function SafePlayerAvatar({ uuid }) {
  const [url, setUrl] = useState(getAvatar(uuid, 64));
  
  return (
    <img
      src={url}
      onError={() => setUrl(`https://crafatar.com/avatars/${uuid}?size=64`)}
      alt="Avatar"
    />
  );
}
```

## 🎯 Best Practices

### Performance

- **Use appropriate sizes:** `64px` for thumbnails, `256px` for profiles
- **Cache URLs:** Same parameters = same URL, cache it
- **Fallback strategy:** Always have a backup (Crafatar)

```typescript
// Good
const thumb = getAvatar(uuid, 64);
const profile = getBody(uuid, 256);

// Bad - oversized
const thumb = getRenderUrl(uuid, { renderType: 'ultimate', cameraWidth: 2048 });
```

### PMC Plan Integration

```typescript
// Theme-aware renders
function getThemedAvatar(uuid: string, isDark: boolean) {
  return getRenderUrl(uuid, {
    renderType: isDark ? 'dungeons' : 'cheering',
    crop: 'head',
    cameraWidth: 128,
    cameraHeight: 128,
    globalLightColor: isDark ? '1f2937' : 'ffffff'
  });
}

// Cache strategy
const avatarCache = new Map();
function getCachedAvatar(uuid: string, size: number) {
  const key = `${uuid}_${size}`;
  if (!avatarCache.has(key)) {
    avatarCache.set(key, getAvatar(uuid, size));
  }
  return avatarCache.get(key);
}
```

## 🧪 Test URLs

Try these URLs directly in your browser:

- **Avatar:** `https://starlightskins.lunareclipse.studio/render/head/Notch/head`
- **Ultimate pose:** `https://starlightskins.lunareclipse.studio/render/ultimate/Notch/full`
- **With effects:** `https://starlightskins.lunareclipse.studio/render/cheering/_Suki_/face?borderHighlight=true&borderHighlightRadius=10`
- **High-res:** `https://starlightskins.lunareclipse.studio/render/ultimate/Notch/full?cameraWidth=512&renderScale=2`

## 📝 Notes

- **Player identifiers:** Usernames or UUIDs (with/without dashes)
- **Output format:** PNG images
- **Max dimensions:** 3840x3840 pixels
- **Caching:** API has built-in caching

---

**🚀 Ready to integrate beautiful Minecraft renders into PMC Plan!**