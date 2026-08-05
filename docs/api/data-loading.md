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
category, tags, associated space, and their first preview image. Portals expose
the equivalent map fields and linked-portal identity. The response deliberately
omits managers, owners, trade offers, complete image collections, and audit
metadata.

```json
{
  "places": [],
  "portals": []
}
```

Linked portal endpoints keep their world-specific coordinates and descriptions
while sharing their canonical name and slug.

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
`q`; search covers the name, description, and Minecraft members.

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
text, payment terms, and Minecraft providers.

Omitting `view` preserves the complete collection endpoint for API
compatibility. Editors load one complete service through
`GET /api/services/{slug}`.

## Cache and Invalidation

Public projections use the Next.js data cache for five minutes and are tagged
by domain. Successful place, portal, space, service, transfer, and account
deletion mutations immediately revalidate every affected list and detail tag.
The browser keeps the same data in React Query for one minute, shares in-flight
requests, and invalidates only the impacted query families after a mutation.

The database indexes the fields used by collection ordering and filtering,
including content update timestamps, worlds, trade-offer relations, and service
contact types. Public browsing never loads all complete places, portals,
spaces, services, or offers into a second client-side cache.
