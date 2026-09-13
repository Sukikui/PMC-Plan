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

Each page publishes its content name, canonical URL, and generated `1200 × 630`
image through Open Graph and Twitter metadata. Discord and other compatible
clients can therefore render a concise preview while browsers retain the normal
interactive map experience.

## GET `/lieux/{slug}/image`

Generates the public `1200 × 630` PNG social preview for one place. The image
uses the place's first image, associated space identity, world, coordinates,
visible trade-offer count when non-zero, and ordered Minecraft owners. Missing
or unavailable remote images fall back to local application assets without
preventing the preview from rendering.

During development, open this route directly in a browser to inspect the exact
image that will later be referenced by the place's Open Graph metadata:

```text
http://localhost:3000/lieux/example-place/image
```

Unknown slugs return `404`. Development requests bypass the persistent database
cache; production results use the shared public-detail invalidation contract.

## GET `/portails/{slug}/image`

Generates the public `1200 × 630` PNG social preview for one portal using the
same identity, image, space, and owner presentation as place previews. A linked
portal stacks its Overworld coordinates above its Nether coordinates and
appends the Nether address to the second line. A standalone Nether portal
appends its own Nether address, while a standalone Overworld portal displays
coordinates only.

```text
http://localhost:3000/portails/example-portal/image
```

Unknown slugs return `404`. Linked sides resolve through their shared map entry
so the preview remains canonical for the portal pair.

## GET `/espaces/{slug}/image`

Generates the public `1200 × 630` PNG social preview for one space. The header
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
