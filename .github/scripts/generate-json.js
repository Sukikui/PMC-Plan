// Helper script to generate JSON from GitHub issue template data
// This can be used by maintainers or in future automation

/**
 * Generate place JSON from issue template data
 */
function generatePlaceJson(data) {
  const place = {
    id: data.id.trim(),
    name: data.name.trim(),
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


  return place;
}

/**
 * Generate portal JSON from issue template data
 */
function generatePortalJson(data) {
  const portal = {
    id: data.id.trim(),
    name: data.name.trim(),
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