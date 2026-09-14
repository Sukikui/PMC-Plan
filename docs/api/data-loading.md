# Public Data Loading API

The interactive map uses separate collection and detail contracts. Collection
responses contain only the fields required to render their current view;
complete management, image, offer, and ownership data is loaded only when a
user opens the corresponding content.

Paginated responses share this envelope:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 24,
    "total": 0,
    "totalPages": 1
  }
}
```

`page` starts at `1`. `pageSize` is clamped between `1` and `50`.

## GET `/api/map-content`

Returns the complete lightweight projection required by the map and destination
panel. Places include identity, world, coordinates, description, address,
category, tags, canonical color, associated space, and their first preview
image. Portals expose the equivalent map fields, linked-portal identity, and
their first preview image. An unidentified portal exposes the French status
label through `name`, sets `unidentified` to `true`, and retains its generated
technical slug only for identity and mutations. The response deliberately
omits managers, owners,
trade offers, complete image collections, and audit metadata.

The complete detail response lets any approved user open the same portal editor
used for regular updates. The API infers a claim when a non-manager submits a
final public identity for an unidentified portal, then atomically replaces the
temporary management team with the claimant and the team submitted by that
editor. No separate claim mode, request resource, or cache entry is persisted.

```json
{
  "places": [],
  "portals": []
}
```

Linked portal endpoints keep their world-specific coordinates and descriptions
while sharing their canonical name, slug, and color. Map points resolve their
effective color as `space.color` when associated, then fall back to the
map-entry `color`. Linked endpoints also share the preview selected from their
common map-entry gallery.

Complete portal details follow the same boundary. `name` is always a renderable
string, while `unidentified` determines whether clients present it as a status
rather than as player-authored content.

## GET `/api/map-entries/{id}/detail`

Loads the complete public place or portal only when an overlay needs it.

Parameters:

- `type`: required, either `place` or `portal`.

The path identifier is the stable map-entry ID rather than the mutable content
slug. Invalid types return `400`; missing content returns `404`.

```json
{
  "type": "place",
  "item": {}
}
```

## Public Content Pages

`GET /lieux/{slug}`, `GET /portails/{slug}`, and `GET /espaces/{slug}` are
shareable entry points to the main application. Each route validates the slug
on the server, returns `404` for missing content, and opens the corresponding
overlay after the startup screen has completed. The routes reuse the regular
map and overlay components rather than maintaining a parallel public UI.

Each page publishes its content name, canonical URL, and generated `1200 × 957`
image through Open Graph and Twitter metadata. Place and portal embed titles
append the associated space name when one exists, separated by `•`. Their
descriptions contain only coordinates, on one line per represented world. A
linked portal therefore lists both its Overworld and Nether coordinates.
Discord and other compatible clients can render a concise preview while
browsers retain the normal interactive map experience.

## GET `/lieux/{slug}/image`

Generates the public `1200 × 957` PNG social preview for one place. The image
uses the place's first image, associated space identity, world, coordinates,
and ordered Minecraft owners. Missing or unavailable remote images fall back
to local application assets without preventing the preview from rendering.

During development, open this route directly in a browser to inspect the exact
image that will later be referenced by the place's Open Graph metadata:

```text
http://localhost:3000/lieux/example-place/image
```

Unknown slugs return `404`. Development requests bypass the persistent database
cache; production results use the shared public-detail invalidation contract.

## GET `/portails/{slug}/image`

Generates the public `1200 × 957` PNG social preview for one portal using the
same identity, image, space, and owner presentation as place previews. A linked
portal stacks its Overworld coordinates above its Nether coordinates and
appends the Nether address to the second line. A standalone Nether portal
appends its own Nether address, while a standalone Overworld portal displays
coordinates only. When the footer would overflow, the owner identity contracts
to the Minecraft head and additional-owner count.

```text
http://localhost:3000/portails/example-portal/image
```

Unknown slugs return `404`. Linked sides resolve through their shared map entry
so the preview remains canonical for the portal pair.

## GET `/espaces/{slug}/image`

Generates the public `1200 × 957` PNG social preview for one space. The header
uses the space logo and name, the center uses the first image from an associated
place when available, and the footer includes place, portal, and offer counts
alongside the first derived Minecraft member. Missing remote assets fall back
to the generated space identity or local player head without failing the image.

During development, open this route directly to inspect the rendered preview:

```text
http://localhost:3000/espaces/example-space/image
```

Unknown slugs return `404`. The route reuses the lightweight explorer summary
and the same cache invalidation contract as the public space collection.

## GET `/api/media/user-image`

Proxies user-provided place and portal images and space logos through PMC Plan.
The `url` query parameter must exactly match an image URL currently persisted
on a map entry or space. Local application assets, Minecraft heads, and Discord
assets do not use this endpoint.

The endpoint validates the source protocol, DNS resolution, redirects, media
type, and response size before returning the bytes. It rejects private network
destinations and acts only as a closed proxy for persisted application content,
not as a general-purpose remote image proxy.

Successful responses are cached in the browser for one day and on Vercel's CDN
for up to one year. Distinct source query values produce distinct cache entries.
The CDN cache is best-effort and may evict an image earlier; a cache miss simply
causes PMC Plan to validate and retrieve the persisted source again. Invalid,
unreferenced, unavailable, or oversized sources are never cached.

Public map points, hover previews, content overlays, space logos, explorer
tiles, and social-image generation all reuse this URL builder. Content forms
keep their direct source preview so a new URL can be checked before it exists in
the database.

## POST `/api/social-preview/warm`

Prepares the current version of a place, portal, or space social preview when a
user focuses, hovers, or clicks its shareable title. The endpoint accepts only a
known public content path:

```json
{
  "path": "/lieux/example-place"
}
```

It reloads the public content, derives the same content hash used by page
metadata, and requests the corresponding versioned `/image?v={hash}` route.
Concurrent intentions for the same title are deduplicated in the browser. This
is a performance hint only: sharing remains functional when the warm request
fails or never occurs.

Versioned social images are cached on Vercel's CDN for up to one year only when
all persisted user images required by the render loaded successfully. A render
using a fallback receives a short cache lifetime so a temporarily unavailable
source can recover. Changing any content used by the preview changes its image
version and therefore selects a fresh cache entry.

## GET `/api/market/offers`

Returns paginated global offers with their minimal place, space, and ordered
owner presentation data.

Parameters:

- `page`: optional page number.
- `pageSize`: optional size, default `30`.
- `q`: optional case-insensitive search across descriptions, item identifiers,
  custom item names, places, spaces, and Minecraft owners.

## Space Collection Views

`GET /api/spaces?view=summary` returns paginated explorer tiles. Each item
contains the public space identity, preview image, first member, distinct member
count, and place, portal, and offer counts. It accepts `page`, `pageSize`, and
`q`; search covers the name, description, and Minecraft members. The optional
`sort` parameter accepts `name-asc`, `name-desc`, `content-asc`, or
`content-desc` (default). Content ordering uses the combined place and portal
count, then the space name.

`GET /api/spaces?view=reference` returns only the spaces manageable by the
authenticated effective role. It is used by content forms and contains the
small identity and logo shape required by the selector.

Omitting `view` preserves the complete collection endpoint for API
compatibility. The application does not use that collection for startup or
public browsing.

## Service Collection Views

`GET /api/services?view=summary` returns the paginated marketplace service
projection. It accepts `page`, `pageSize`, `q`, and an optional `contact` value
of `none`, `primary_manager`, or `custom`. Search covers the visible service
text, payment terms, and Minecraft providers. Each summary exposes the resolved
`contactHref` used by the interface without exposing the manager's Discord
platform identifier as an identity field.

Omitting `view` preserves the complete collection endpoint for API
compatibility. Editors load one complete service through
`GET /api/services/{slug}`.

## Cache and Invalidation

Public projections use the Next.js data cache for five minutes and are tagged
by domain. Successful place, portal, space, service, transfer, and account
deletion mutations immediately revalidate every affected list and detail tag.
The browser keeps the same data in TanStack Query for one minute, shares in-flight
requests, and invalidates only the impacted query families after a mutation.

Persistent server cache keys and tags are scoped with an opaque fingerprint of
the configured database identity, so separate deployments cannot reuse each
other's cached projections. `next dev` bypasses this persistent layer entirely
so a local snapshot restoration or database switch is reflected immediately.

The database indexes the fields used by collection ordering and filtering,
including content update timestamps, worlds, trade-offer relations, and service
contact types. Public browsing never loads all complete places, portals,
spaces, services, or offers into a second client-side cache.

## Discord Server Preview

`GET /api/discord/invite?url={inviteUrl}` resolves an official Discord invite
URL into the public identity shown by place, portal, and space overlays.

```json
{
  "server": {
    "id": "123456789",
    "name": "ValnyFrost",
    "iconUrl": "https://cdn.discordapp.com/icons/123456789/icon.webp?size=128"
  }
}
```

Only HTTPS invitations hosted by `discord.gg`, `discord.com`, or their official
Discord variants are accepted. The server calls Discord's fixed invite API
origin, so user-provided URLs can never select the upstream host. Discord
responses are cached for six hours. Invalid, expired, or unavailable invites
return `{ "server": null }`; overlays retain a generic Discord identity and the
original invitation link instead of failing to render.
