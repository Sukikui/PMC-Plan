import MapStatus from './MapStatus';
import { themeColors } from '@/lib/theme-colors';

export default function MapRendererStatus({
  error,
  imageUnavailable,
  loading,
}: {
  error: string | null;
  imageUnavailable: boolean;
  loading: boolean;
}) {
  return (
    <>
      {loading && (
        <MapStatus className={themeColors.text.tertiary}>
          Chargement...
        </MapStatus>
      )}
      {error && (
        <MapStatus className={themeColors.feedback.errorText}>
          {error}
        </MapStatus>
      )}
      {imageUnavailable && (
        <MapStatus className={themeColors.feedback.errorText}>
          Image de carte indisponible.
        </MapStatus>
      )}
    </>
  );
}
