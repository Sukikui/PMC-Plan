import { mapMetadataByWorld } from './metadata';

let overworldMapImageLoaded = false;
let overworldMapImagePromise: Promise<void> | null = null;

export function preloadOverworldMapImage() {
  if (typeof window === 'undefined' || overworldMapImageLoaded) {
    return Promise.resolve();
  }
  if (overworldMapImagePromise) return overworldMapImagePromise;

  overworldMapImagePromise = new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      overworldMapImageLoaded = true;
      resolve();
    };
    image.onerror = () => {
      overworldMapImagePromise = null;
      reject(new Error('Impossible de charger l’image de la carte.'));
    };
    image.src = mapMetadataByWorld.overworld.overview.image;
  });
  return overworldMapImagePromise;
}
