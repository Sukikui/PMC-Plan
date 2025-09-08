import { getRenderUrl } from './starlight-skin-api';
import { Place } from '../app/api/utils/shared';

/**
 * Extract all unique owners from place JSON files
 */
export async function extractOwnersFromPlaces(): Promise<string[]> {
  try {
    // Fetch all JSON files from place_examples directory
    const response = await fetch('/api/places');
    if (!response.ok) {
      console.warn('Failed to fetch places for skin preloading');
      return [];
    }
    
    const places: Place[] = await response.json();
    
    // Extract unique owners (exclude null/undefined)
    const owners = places
      .map(place => place.owner)
      .filter((owner): owner is string => owner !== null && owner !== undefined)
      .filter((owner, index, array) => array.indexOf(owner) === index); // Remove duplicates
    
    console.log(`Found ${owners.length} unique owners for skin preloading:`, owners);
    return owners;
  } catch (error) {
    console.warn('Error extracting owners for skin preloading:', error);
    return [];
  }
}

/**
 * Preload skin images for given owners
 */
export function preloadSkinImages(owners: string[]): void {
  if (owners.length === 0) return;
  
  console.log(`Starting skin preload for ${owners.length} owners...`);
  
  owners.forEach((owner, index) => {
    // Use same config as InfoOverlay.tsx
    const imageUrl = getRenderUrl(owner, {
      renderType: 'mojavatar',
      crop: 'full',
      borderHighlight: true,
      borderHighlightRadius: 7,
      dropShadow: true,
    });
    
    // Create image element to trigger download
    const img = new Image();
    
    // Optional: track loading success/failure
    img.onload = () => {
      console.log(`✅ Preloaded skin ${index + 1}/${owners.length}: ${owner}`);
    };
    
    img.onerror = () => {
      console.warn(`❌ Failed to preload skin: ${owner}`);
    };
    
    // Start the download
    img.src = imageUrl;
  });
}

/**
 * Main preload function - combines extraction and preloading
 */
export async function prewarmAllSkins(): Promise<void> {
  const owners = await extractOwnersFromPlaces();
  preloadSkinImages(owners);
}