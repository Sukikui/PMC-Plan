import { useEffect, useState } from 'react';

export const useMapImage = (imageSrc: string) => {
  const [imageFailed, setImageFailed] = useState(false);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    setMapImage(null);
    setImageFailed(false);

    if (!imageSrc) {
      return;
    }

    const image = new Image();
    image.onload = () => setMapImage(image);
    image.onerror = () => setImageFailed(true);
    image.src = imageSrc;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [imageSrc]);

  return {
    imageFailed,
    mapImage,
  };
};
