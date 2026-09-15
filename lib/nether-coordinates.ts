export interface CoordinateFields {
  x: string | number;
  y: string | number;
  z: string | number;
}

export function convertOverworldToNether(x: number, z: number) {
  return {
    x: Math.floor(x / 8),
    z: Math.floor(z / 8),
  };
}

export function convertOverworldCoordinateFieldsToNether(
  coordinates: CoordinateFields,
): CoordinateFields {
  return convertCoordinateFields(coordinates, Math.floor, 1 / 8);
}

export function convertNetherCoordinateFieldsToOverworld(
  coordinates: CoordinateFields,
): CoordinateFields {
  return convertCoordinateFields(coordinates, (value) => value, 8);
}

function convertCoordinateFields(
  coordinates: CoordinateFields,
  roundHorizontal: (value: number) => number,
  horizontalScale: number,
): CoordinateFields {
  return {
    x: convertCoordinateField(coordinates.x, (value) => (
      roundHorizontal(value * horizontalScale)
    )),
    y: convertCoordinateField(coordinates.y, (value) => value),
    z: convertCoordinateField(coordinates.z, (value) => (
      roundHorizontal(value * horizontalScale)
    )),
  };
}

function convertCoordinateField(
  value: string | number,
  convert: (value: number) => number,
) {
  const normalized = String(value).trim();
  if (!normalized) return '';

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? String(convert(parsed)) : '';
}
