import type {
  MapEntryCreationPayload,
  MapEntryEditor,
  MapEntryUpdatePayload,
} from '@/lib/map-entry/types';
import type { SpaceReference } from '@/lib/spaces/types';

export interface InitialPortalData {
  type: 'portal';
  color: string;
  images?: string[];
  variant: 'overworld' | 'nether' | 'linked';
  name: string;
  id: string;
  canDelete?: boolean;
  lastEditor?: MapEntryEditor;
  managerIds: string[];
  mapEntryId?: string;
  primaryManagerId: string;
  space?: SpaceReference | null;
  coordinates?: { x: number; y: number; z: number };
  address?: string;
  overworldCoordinates?: { x: number; y: number; z: number };
  netherCoordinates?: { x: number; y: number; z: number };
  description?: string;
  netherAddress?: string;
}

interface PortalPayloadBase {
  color: string;
  images: string[];
  management?: MapEntryCreationPayload | MapEntryUpdatePayload;
  spaceId: string | null;
}

interface SinglePortalPayload extends PortalPayloadBase {
  mode: 'single';
  portal: {
    slug: string;
    name: string;
    world: 'overworld' | 'nether';
    coordinates: { x: number; y: number; z: number };
    description?: string;
    address?: string;
  };
}

interface LinkedPortalPayload extends PortalPayloadBase {
  mode: 'linked';
  slug: string;
  name: string;
  overworld: {
    coordinates: { x: number; y: number; z: number };
    description?: string;
  };
  nether: {
    coordinates: { x: number; y: number; z: number };
    description?: string;
    address?: string;
  };
}

export type PortalFormPayload = SinglePortalPayload | LinkedPortalPayload;
