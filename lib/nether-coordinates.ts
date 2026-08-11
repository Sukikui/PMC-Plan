export interface NumericCoordinates {
  x: number;
  y: number;
  z: number;
}

export function convertOverworldToNether(x: number, z: number) {
  return {
    x: Math.floor(x / 8),
    z: Math.floor(z / 8),
  };
}

export function convertOverworldCoordinatesToNether(
  coordinates: NumericCoordinates,
): NumericCoordinates {
  const horizontal = convertOverworldToNether(coordinates.x, coordinates.z);
  return { ...horizontal, y: coordinates.y };
}
