# Contributing to PMC Map

Thank you for your interest in contributing to the PMC Map project! This document explains how community members can add new places and portals to the map.

## 🏠 Adding a New Place

Places are locations of interest on the server (bases, farms, shops, etc.).

### Method 1: Using GitHub Issues (Recommended for non-developers)

1. Go to the [Issues page](https://github.com/tristanhabemont/PMC-Map/issues)
2. Click "New Issue"
3. Select "🏠 Add New Place" template
4. Fill out all required fields:
   - **Place ID**: Unique identifier (lowercase, underscores only)
   - **Place Name**: Display name
   - **Monde**: overworld or nether
   - **Coordinates**: X, Y, Z coordinates
   - **Description**: Brief description (optional)
   - **Tags**: Comma-separated tags (optional)
5. Submit the issue

Our automated validation will check your data format and notify you of any issues.

### Method 2: Direct Pull Request (For developers)

1. Fork the repository
2. Create a new JSON file in `public/data/places/` named `{place-id}.json`
3. Follow this format:

```json
{
  "id": "my_awesome_base",
  "name": "My Awesome Base",
  "world": "overworld",
  "coordinates": { "x": 100, "y": 64, "z": 200 },
  "tags": ["base", "storage", "farm"],
  "description": "A large base with automated farms and storage systems",
}
```

4. Create a pull request

## 🌀 Adding a New Portal

Portals are nether portals that connect different dimensions or locations.

### Method 1: Using GitHub Issues (Recommended for non-developers)

1. Go to the [Issues page](https://github.com/tristanhabemont/PMC-Map/issues)
2. Click "New Issue"
3. Select "🌀 Add New Portal" template
4. Fill out all required fields:
   - **Portal ID**: Unique identifier (lowercase, underscores only)
   - **Portal Name**: Display name
   - **Monde**: overworld or nether
   - **Coordinates**: X, Y, Z coordinates
   - **Description**: Brief description (optional)
5. Submit the issue

### Method 2: Direct Pull Request (For developers)

1. Fork the repository
2. Create a new JSON file in `public/data/portals/` named `{portal-id}.json`
3. Follow this format:

```json
{
  "id": "my_base_portal_ow",
  "name": "My Base Portal (Overworld)",
  "world": "overworld",
  "coordinates": { "x": 150, "y": 64, "z": 300 },
  "description": "Portal connecting to my base in the nether"
}
```

4. Create a pull request

## 📋 Data Validation

All contributions are automatically validated using JSON schemas:

### Place Requirements:
- **id**: Lowercase letters, numbers, and underscores only
- **name**: 1-100 characters
- **world**: Must be "overworld" or "nether"
- **coordinates**: Valid X, Y, Z numbers
- **tags**: Max 10 tags, each 1-30 characters (optional)
- **description**: Max 500 characters (optional)

### Portal Requirements:
- **id**: Lowercase letters, numbers, and underscores only
- **name**: 1-100 characters
- **world**: Must be "overworld" or "nether"
- **coordinates**: Valid X, Y, Z numbers
- **description**: Max 500 characters (optional)

## ✅ Review Process

1. **Automated Validation**: Your JSON format is checked automatically
2. **Maintainer Review**: A project maintainer reviews your contribution
3. **Approval**: Once approved, your place/portal is added to the map!

## 🚫 Guidelines

- Only add places/portals you have permission to share publicly
- Ensure coordinates are accurate
- Use descriptive but concise names
- Avoid duplicate IDs (system will check this automatically)
- Keep descriptions family-friendly and server-appropriate

## 🔧 For Developers

The project uses:
- JSON Schema for validation
- GitHub Actions for automated checks
- Zod schemas in TypeScript for runtime validation

Schema files are located in `.github/schemas/`:
- `place-schema.json` - Place validation schema
- `portal-schema.json` - Portal validation schema

## 📞 Need Help?

If you encounter issues or have questions:
1. Check existing issues for similar problems
2. Create a new issue with the "question" or "help wanted" label
3. Provide as much detail as possible about your problem

Thank you for helping make the PMC Map better for everyone! 🎉