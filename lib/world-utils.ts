/**
 * Normalise les noms de monde depuis le format PlayerCoordsAPI vers le format API
 * PlayerCoordsAPI retourne: 'minecraft:overworld', 'minecraft:the_nether'
 * L'API attend: 'overworld', 'nether'
 */

export type WorldName = 'overworld' | 'nether';
export type MinecraftWorldName = 'minecraft:overworld' | 'minecraft:the_nether' | 'overworld' | 'nether';

/**
 * Convertit un nom de monde PlayerCoordsAPI vers le format normalisé
 * @param world - Le nom de monde depuis PlayerCoordsAPI ou déjà normalisé
 * @returns Le nom de monde normalisé ou null si invalide
 */
export function normalizeWorldName(world: string | MinecraftWorldName): WorldName | null {
  if (!world || typeof world !== 'string') {
    return null;
  }

  const normalizedWorld = world.toLowerCase().trim();

  switch (normalizedWorld) {
    case 'minecraft:overworld':
    case 'overworld':
      return 'overworld';
    
    case 'minecraft:the_nether':
    case 'nether':
      return 'nether';
    
    default:
      return null;
  }
}

/**
 * Vérifie si un nom de monde est valide
 * @param world - Le nom de monde à vérifier
 * @returns true si le monde est valide
 */
export function isValidWorldName(world: string): world is WorldName {
  return normalizeWorldName(world) !== null;
}

/**
 * Convertit un nom de monde avec gestion d'erreur
 * @param world - Le nom de monde à convertir
 * @param defaultWorld - Le monde par défaut si la conversion échoue
 * @returns Le nom de monde normalisé ou le monde par défaut
 */
export function normalizeWorldNameWithFallback(
  world: string | MinecraftWorldName, 
  defaultWorld: WorldName = 'overworld'
): WorldName {
  return normalizeWorldName(world) ?? defaultWorld;
}