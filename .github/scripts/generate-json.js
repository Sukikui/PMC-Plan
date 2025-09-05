
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

  if (data.tags && data.tags.trim()) {
    place.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  } else {
    place.tags = [];
  }

  if (data.description && data.description.trim()) {
    place.description = data.description.trim();
  } else {
    place.description = "";
  }

  if (data.discord && data.discord.trim()) {
    place.discord = data.discord.trim();
  } else {
      place.discord = "";
  }

  if (data.owner && data.owner.trim()) {
    place.owner = data.owner.trim();
  } else {
    place.owner = "";
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

    if (data.description && data.description.trim()) {
        portal.description = data.description.trim();
    } else {
        portal.description = "";
    }
    return portal;
}

module.exports = {
  generatePlaceJson,
  generatePortalJson
};