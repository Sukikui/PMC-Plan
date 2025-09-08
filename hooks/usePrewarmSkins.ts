import { useEffect } from 'react';
import { getRenderUrl } from '../lib/starlight-skin-api';
import { Place } from '../app/api/utils/shared';

/**
 * Hook to preload all skin images on app startup
 */
export function usePrewarmSkins() {
  useEffect(() => {
    const prewarmAllSkins = async () => {
      try {
        const response = await fetch('/api/places');
        if (!response.ok) {
          console.warn('Failed to fetch places for skin preloading');
          return;
        }
        
        const places: Place[] = await response.json();
        
        // Extract unique owners
        const owners = places
          .map(place => place.owner)
          .filter((owner): owner is string => owner !== null && owner !== undefined)
          .filter((owner, index, array) => array.indexOf(owner) === index);
        
        if (owners.length === 0) return;
        
        console.log(`Starting skin preload for ${owners.length} owners...`);
        
        // Create hidden preload container
        let preloadContainer = document.getElementById('skin-preload-container');
        if (!preloadContainer) {
          preloadContainer = document.createElement('div');
          preloadContainer.id = 'skin-preload-container';
          preloadContainer.style.cssText = 'display: none !important; position: absolute; left: -9999px;';
          document.body.appendChild(preloadContainer);
        }
        
        owners.forEach((owner, index) => {
          const imageUrl = getRenderUrl(owner, {
            renderType: 'mojavatar',
            crop: 'full',
            borderHighlight: true,
            borderHighlightRadius: 7,
            dropShadow: true,
          });
          
          const img = document.createElement('img');
          img.crossOrigin = 'anonymous';
          img.onload = () => console.log(`✅ Preloaded skin ${index + 1}/${owners.length}: ${owner}`);
          img.onerror = () => console.warn(`❌ Failed to preload skin: ${owner}`);
          img.src = imageUrl;
          
          preloadContainer.appendChild(img);
        });
        
        console.log('🚀 Skin prewarming completed');
      } catch (error) {
        console.warn('Error during skin preloading:', error instanceof Error ? error.message : error);
      }
    };

    prewarmAllSkins();
  }, []);
}