import { useEffect } from 'react';
import { getRenderUrl } from '../lib/starlight-skin-api';

/**
 * Hook to preload the current player's skin from PlayerCoordsAPI
 */
export function usePrewarmPlayerSkin() {
  useEffect(() => {
    const preloadPlayerSkin = async () => {
      try {
        // Try to fetch current player UUID from local API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch('http://localhost:25565/api/coords', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.log('PlayerCoordsAPI not available for skin preloading');
          return;
        }

        const data = await response.json();
        
        if (!data.uuid) {
          console.warn('No UUID found in PlayerCoordsAPI response');
          return;
        }

        console.log(`Preloading player skin for UUID: ${data.uuid}`);
        
        // Create hidden preload container for player skin
        let preloadContainer = document.getElementById('player-skin-preload-container');
        if (!preloadContainer) {
          preloadContainer = document.createElement('div');
          preloadContainer.id = 'player-skin-preload-container';
          preloadContainer.style.cssText = 'display: none !important; position: absolute; left: -9999px;';
          document.body.appendChild(preloadContainer);
        }

        // Use same config as PositionPanel.tsx
        const imageUrl = getRenderUrl(data.uuid, {
          renderType: 'ultimate',
          crop: 'face',
          borderHighlight: true,
          borderHighlightRadius: 7,
          dropShadow: true,
        });
        
        const img = document.createElement('img');
        img.crossOrigin = 'anonymous';
        img.onload = () => console.log(`✅ Preloaded player skin: ${data.uuid}`);
        img.onerror = () => console.warn(`❌ Failed to preload player skin: ${data.uuid}`);
        img.src = imageUrl;
        
        preloadContainer.appendChild(img);
        
        console.log('🚀 Player skin prewarming completed');
      } catch (error) {
        console.log('PlayerCoordsAPI not available for skin preloading:', error instanceof Error ? error.message : error);
      }
    };

    preloadPlayerSkin();
  }, []);
}