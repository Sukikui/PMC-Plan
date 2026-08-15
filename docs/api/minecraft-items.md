# Minecraft Items API

The Minecraft Items API resolves localized item and block names together with
their texture URLs. PMC Plan uses it to render trade items, service
illustrations, and payment items consistently.

## Configuration

`MINECRAFT_VERSION` selects the Minecraft Java Edition asset version used by
the endpoint. Development and deployment environments should define an exact
version so names and textures remain stable.

```env
MINECRAFT_VERSION=26.1.2
```

When the variable is absent or set to `latest`, the endpoint resolves the
current release from Mojang's launcher manifest. This fallback can change when
Minecraft publishes a new release and should not be used for a controlled
deployment.

## GET `/api/mc/resolve`

### Query Parameters

| Parameter | Required | Description |
| --- | --- | --- |
| `id` | Yes | Item or block identifier, with or without the `minecraft:` namespace. |
| `lang` | No | Minecraft locale. Defaults to `fr_fr`. |

```http
GET /api/mc/resolve?id=minecraft:diamond&lang=fr_fr
```

### Response

A successful request returns the requested identifier, the resolved Minecraft
version, the localized display name, and one or more texture URLs.

```json
{
  "id": "minecraft:diamond",
  "version": "26.1.2",
  "name": "Diamant",
  "textures": [
    "https://assets.mcasset.cloud/26.1.2/assets/minecraft/textures/item/diamond.png"
  ]
}
```

Items normally expose one texture. Blocks may expose several textures from
their block model. When a block model cannot be resolved, the endpoint returns
the conventional block texture URL as a fallback.

Missing `id` parameters return HTTP `400`. Version, locale, or upstream asset
failures return HTTP `500` with an error description.

## Resolution Sources

The endpoint uses:

- Mojang's launcher manifest to resolve the configured version;
- the corresponding Mojang version metadata;
- mcasset.cloud language files for localized names;
- mcasset.cloud item textures and block models for rendering assets.

Only Minecraft Java Edition assets are supported. If a translation is absent,
the endpoint derives a readable name from the identifier.

## Caching

Version metadata, language files, and block models are cached in memory for the
lifetime of the server instance. Successful API responses also include a
24-hour public immutable cache policy.

The cache is instance-local. Serverless instances may therefore maintain
separate in-memory entries, while the HTTP response cache remains the main
cross-request optimization.

## Client Helper

Browser code should use `getItemInfo` from `lib/minecraft/items.ts` instead of
constructing endpoint requests independently. `getTextures` in the same module
normalizes texture extraction for the existing item visualizers.
