import type { Place, Portal } from '@/lib/api/types';
import InfoOverlay from '@/components/InfoOverlay';
import SpaceInfoOverlay from '@/components/spaces/SpaceInfoOverlay';
import Overlay from '@/components/ui/Overlay';
import type {
  InfoOverlayLayer,
} from '@/components/overlay/useInfoOverlayStack';
import type { Space } from '@/lib/spaces/types';

interface InfoOverlayStackProps {
  layers: InfoOverlayLayer[];
  onClose: (layerId: number) => void;
}

export default function InfoOverlayStack({
  layers,
  onClose,
}: InfoOverlayStackProps) {
  return (
    <>
      {layers.map((layer) => {
        const close = () => onClose(layer.id);
        return (
          <Overlay
            closing={layer.isClosing}
            isOpen
            key={layer.id}
            onClose={close}
          >
            {layer.type === 'space' ? (
              <SpaceInfoOverlay
                onClose={close}
                space={layer.item as Space}
              />
            ) : (
              <InfoOverlay
                item={layer.item as Place | Portal}
                onClose={close}
                onSelectItem={layer.onSelectItem}
                type={layer.type}
              />
            )}
          </Overlay>
        );
      })}
    </>
  );
}
