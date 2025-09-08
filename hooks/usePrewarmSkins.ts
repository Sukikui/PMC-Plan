import { useEffect, useState } from 'react';
import { prewarmAllSkins } from '../lib/preload-skins';

/**
 * Hook to preload all skin images on app startup
 * Runs once on mount, loads images in background
 */
export function usePrewarmSkins() {
  const [isPrewarming, setIsPrewarming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const startPrewarming = async () => {
      if (isComplete) return; // Don't run twice
      
      setIsPrewarming(true);
      
      try {
        await prewarmAllSkins();
        
        if (isMounted) {
          setIsComplete(true);
          console.log('🚀 Skin prewarming completed');
        }
      } catch (error) {
        console.warn('Skin prewarming failed:', error);
      } finally {
        if (isMounted) {
          setIsPrewarming(false);
        }
      }
    };

    startPrewarming();

    return () => {
      isMounted = false;
    };
  }, [isComplete]); // Dependency on isComplete to prevent re-runs

  return {
    isPrewarming,
    isComplete,
  };
}