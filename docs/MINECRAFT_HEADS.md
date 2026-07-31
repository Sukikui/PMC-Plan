# Minecraft Player Renders

PMC Plan displays Minecraft identities as 2D player heads and uses an iOS body
render in the synchronized position panel. Both representations are provided
by [MC Heads](https://mcheads.org/docs).

The integration is centralized in:

- `lib/minecraft-head-service.ts` for provider and fallback URLs.
- `components/ui/MinecraftHeadImage.tsx` for image rendering and fallback
  behavior.
- `components/position/PlayerPositionView.tsx` for the synchronized iOS body
  presentation.

Head consumers must use `MinecraftHeadImage` instead of constructing provider
URLs directly. Body consumers must use `getMinecraftBodyUrl`. This centralizes
provider parameters and keeps render URLs consistent.

## Provider Endpoints

Minecraft identity heads use:

```text
https://api.mcheads.org/ioshead/{player}/right/{size}
```

The synchronized position panel uses:

```text
https://api.mcheads.org/iosbody/{player}/right/{size}
```

`player` accepts a Minecraft username, UUID, or XUID. The requested PNG size is
restricted to the provider's supported range of 16 to 512 pixels. The shared URL
helpers clamp values outside this range. Head consumers request a 256-pixel
source, while the position panel requests a 512-pixel body source for clean
cropping. The right-facing orientation is shared by both renders.

MC Heads caches generated images for one hour. PMC Plan requests non-default
player images directly from the provider and does not proxy them through its
backend.

## Rendering Scope

Minecraft identities use the same 2D head representation everywhere except the
synchronized position panel. That panel displays a cropped iOS body with a
bottom fade and a player-name badge. There is no separate 3D render path,
camera configuration, lighting option, or provider availability probe.

## Fallback

When no Minecraft account is linked, `MinecraftHeadImage` immediately uses:

```text
/assets/minecraft/default-player-head.png
```

This file is a local copy of the 256-pixel right-facing iOS head generated for
`MHF_steve`. Empty identifiers and any casing of `MHF_steve` resolve to this
asset inside the shared URL helper, so they never trigger an MC Heads request.

If a non-default MC Heads image fails to load, `MinecraftHeadImage` retries with
the same local asset:

```text
/assets/minecraft/default-player-head.png
```

If the synchronized iOS body fails to load, the position panel falls back to
`MinecraftHeadImage`, which then applies the same local fallback behavior.

The provider's `/download/{player}` endpoint returns the raw skin texture rather
than the iOS head render, so it is not used as an application image source.

## Manual Check

```bash
curl -o /dev/null -sS -w '%{http_code} %{content_type}\n' \
  https://api.mcheads.org/ioshead/Notch/right/64

curl -o /dev/null -sS -w '%{http_code} %{content_type}\n' \
  https://api.mcheads.org/iosbody/Notch/right/512
```

A successful request returns HTTP `200` with a PNG content type.
