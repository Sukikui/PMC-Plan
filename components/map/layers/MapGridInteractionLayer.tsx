import AddContentButton from '@/components/AddContentButton';
import { getDefaultMapY } from '@/components/form/common/form-values';
import PlusIcon from '@/components/icons/PlusIcon';
import FloatingStatusBubble, {
  FloatingStatusBubblePresence,
  floatingStatusBubbleCompactClassName,
  getFloatingStatusBubbleClassName,
  useFloatingStatusBubblePresence,
} from '@/components/ui/FloatingStatusBubble';
import type { MapWorld } from '@/lib/map/metadata';
import { themeColors } from '@/lib/theme-colors';
import type { MapGridCell } from '../core/map-grid';
import type { MapViewport } from '../core/map-view';
import {
  MAP_CONTENT_CREATION_Z_INDEX,
  MAP_STATUS_BUBBLE_Z_INDEX,
} from '../core/map-constants';

interface MapGridInteractionLayerProps {
  hoveredCell: MapGridCell | null;
  onDismiss: () => void;
  routeControlsVisible: boolean;
  selectedCell: MapGridCell | null;
  showCoordinates: boolean;
  showHighlights: boolean;
  viewport: MapViewport;
  world: MapWorld;
}

const BUBBLE_HALF_WIDTH_PX = 136;
const BUBBLE_MARGIN_PX = 8;

export default function MapGridInteractionLayer({
  hoveredCell,
  onDismiss,
  routeControlsVisible,
  selectedCell,
  showCoordinates,
  showHighlights,
  viewport,
  world,
}: MapGridInteractionLayerProps) {
  const selectedMatchesHover = Boolean(
    selectedCell
    && hoveredCell
    && selectedCell.coordinates.x === hoveredCell.coordinates.x
    && selectedCell.coordinates.z === hoveredCell.coordinates.z,
  );

  return (
    <>
      {showHighlights && hoveredCell && !selectedMatchesHover && (
        <GridCellHighlight cell={hoveredCell} selected={false} />
      )}
      <GridCoordinatesBubble
        cell={showCoordinates ? hoveredCell : null}
        raised={routeControlsVisible}
      />
      {showHighlights && selectedCell && (
        <>
          <GridCellHighlight cell={selectedCell} selected />
          <ContentCreationBubble
            cell={selectedCell}
            onDismiss={onDismiss}
            viewport={viewport}
            world={world}
          />
        </>
      )}
    </>
  );
}

function GridCoordinatesBubble({
  cell,
  raised,
}: {
  cell: MapGridCell | null;
  raised: boolean;
}) {
  const { displayedValue: displayedCell, visible } = useFloatingStatusBubblePresence(cell);

  return (
    <FloatingStatusBubblePresence
      visible={visible}
      className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${raised ? 'bottom-20' : 'bottom-4'}`}
      style={{ zIndex: MAP_STATUS_BUBBLE_Z_INDEX }}
    >
      {displayedCell && <FloatingStatusBubble
        highlightOnHover={false}
        className={`flex whitespace-nowrap px-3 tabular-nums ${floatingStatusBubbleCompactClassName} ${themeColors.text.secondary}`}
      >
        X <span className={`ml-1 ${themeColors.text.accent}`}>{displayedCell.coordinates.x}</span>
        <span className="mx-2">·</span>
        Z <span className={`ml-1 ${themeColors.text.accent}`}>{displayedCell.coordinates.z}</span>
      </FloatingStatusBubble>}
    </FloatingStatusBubblePresence>
  );
}

function GridCellHighlight({
  cell,
  selected,
}: {
  cell: MapGridCell;
  selected: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-10 ${
        selected ? themeColors.map.gridCellSelected : themeColors.map.gridCellHover
      }`}
      style={{
        height: cell.screen.size,
        left: cell.screen.left,
        top: cell.screen.top,
        width: cell.screen.size,
      }}
    />
  );
}

function ContentCreationBubble({
  cell,
  onDismiss,
  viewport,
  world,
}: {
  cell: MapGridCell;
  onDismiss: () => void;
  viewport: MapViewport;
  world: MapWorld;
}) {
  const placeAbove = shouldPlaceBubbleAbove(cell);
  const initialPosition = {
    world,
    ...cell.coordinates,
    y: getDefaultMapY(world),
  };

  return (
    <div
      className="pointer-events-auto absolute w-max max-w-[calc(100%-1rem)]"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      style={{
        zIndex: MAP_CONTENT_CREATION_Z_INDEX,
        left: getBubbleLeft(cell, viewport, BUBBLE_HALF_WIDTH_PX),
        top: placeAbove
          ? cell.screen.top - BUBBLE_MARGIN_PX
          : cell.screen.top + cell.screen.size + BUBBLE_MARGIN_PX,
        transform: placeAbove ? 'translate(-50%, -100%)' : 'translateX(-50%)',
      }}
    >
      <AddContentButton
        formOptions={{ initialPosition }}
        onAction={onDismiss}
        className={getFloatingStatusBubbleClassName({
          className: '!gap-1 !py-2 !pl-3 !pr-4',
          highlightOnHover: false,
        })}
      >
        <PlusIcon className="h-5 w-5 shrink-0" />
        Ajouter un lieu ou un portail
      </AddContentButton>
    </div>
  );
}

function getBubbleLeft(
  cell: MapGridCell,
  viewport: MapViewport,
  preferredHalfWidth: number,
) {
  const center = cell.screen.left + cell.screen.size / 2;
  const availableHalfWidth = Math.max(
    0,
    (viewport.width - BUBBLE_MARGIN_PX * 2) / 2,
  );
  const halfWidth = Math.min(preferredHalfWidth, availableHalfWidth);
  return Math.min(
    Math.max(center, BUBBLE_MARGIN_PX + halfWidth),
    viewport.width - BUBBLE_MARGIN_PX - halfWidth,
  );
}

function shouldPlaceBubbleAbove(cell: MapGridCell) {
  return cell.screen.top >= 64;
}
