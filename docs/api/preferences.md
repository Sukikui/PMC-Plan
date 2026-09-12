# Account Preferences API

Authenticated users can persist appearance preferences across browsers. The
stored document is versioned so new preference groups can be added without
creating separate persistence mechanisms.

## Preference document

```json
{
  "version": 3,
  "theme": "system",
  "map": {
    "zoomIconsEnabled": true,
    "imagePreviewsEnabled": true,
    "pointBorderLevel": 1,
    "translucentPointBorders": true,
    "pointSize": 1,
    "netherAxesEnabled": true,
    "zoomLabelsEnabled": false,
    "pointerCoordinatesEnabled": false,
    "dominantSpaceIndicatorEnabled": true
  }
}
```

## `GET /api/account/preferences`

Returns the current user's preference document. `preferences` is `null` until
the account has been initialized from browser preferences.

## `PUT /api/account/preferences`

Persists a complete preference document. The request body includes:

- `preferences`: the complete document for the current schema version.
- `initializeOnly`: when `true`, writes only if the database field is still
  null and returns the existing document otherwise. This makes the first login
  import atomic when several browser sessions start concurrently.

The browser keeps separate guest preferences and per-account caches. On first
login, guest preferences initialize an empty account. On later logins, the
database document takes precedence. While authenticated, updates apply locally
immediately and synchronize with the account in the background.
