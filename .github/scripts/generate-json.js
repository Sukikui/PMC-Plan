// Helper script to generate JSON from GitHub issue template data
// This can be used by maintainers or in future automation

/**
 * Generate place JSON from issue template data
 */
function generatePlaceJson(data) {
  const place = {
    id: data.placeId.trim(),
    name: data.placeName.trim(),
    world: data.world,
    coordinates: {
      x: parseFloat(data.coordinatesX),
      y: parseFloat(data.coordinatesY),
      z: parseFloat(data.coordinatesZ)
    }
  };

  // Add optional fields only if they have values
  if (data.tags && data.tags.trim()) {
    place.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  } else {
    place.tags = [];
  }

  if (data.description && data.description.trim()) {
    place.description = data.description.trim();
  }

  if (data.portals && data.portals.trim()) {
    place.portals = data.portals.split(',').map(portal => portal.trim()).filter(portal => portal);
  } else {
    place.portals = [];
  }

  if (data.imageUrl && data.imageUrl.trim()) {
    place.imageUrl = data.imageUrl.trim();
  }

  return place;
}

/**
 * Generate portal JSON from issue template data
 */
function generatePortalJson(data) {
    const portal = {
        id: data.portalId.trim(),
        name: data.portalName.trim(),
        world: data.world,
        coordinates: {
            x: parseFloat(data.coordinatesX),
            y: parseFloat(data.coordinatesY),
            z: parseFloat(data.coordinatesZ)
        }
    };

    // Add optional fields only if they have values
    if (data.description && data.description.trim()) {
        portal.description = data.description.trim();
    }
    return portal;
}

module.exports = {
  generatePlaceJson,
  generatePortalJson
};