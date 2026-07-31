'use client';

import { useRef } from 'react';
import { normalizePlaceImages } from '@/lib/place/images';
import { normalizeTradeOfferDescription } from '@/lib/trade-offers';
import type { PlaceCategory } from '@/lib/place/categories';
import type {
  FormPlaceImage,
  FormTradeItem,
  FormTradeOffer,
} from '../place/place-form-types';
import { slugify, type CoordinatesInput } from './form-utils';

interface PlaceSnapshotInput {
  address: string;
  category: PlaceCategory;
  coordinates: CoordinatesInput;
  description: string;
  discordUrl: string;
  images: FormPlaceImage[];
  name: string;
  offers: FormTradeOffer[];
  slugSource: string;
  spaceId: string | null;
  tags: string[];
  world: 'overworld' | 'nether';
}

interface PortalSnapshotInput {
  description: string;
  linkedCoordinates: {
    nether: CoordinatesInput;
    overworld: CoordinatesInput;
  };
  name: string;
  netherAddress: string;
  singleAddress: string;
  singleCoordinates: CoordinatesInput;
  slugSource: string;
  spaceId: string | null;
  variant: 'overworld' | 'nether' | 'linked';
}

export function useFormHasChanges(snapshot: unknown, ready = true) {
  const serializedSnapshot = JSON.stringify(snapshot);
  const initialSnapshot = useRef<string | null>(null);

  if (ready && initialSnapshot.current === null) {
    initialSnapshot.current = serializedSnapshot;
  }

  return ready && serializedSnapshot !== initialSnapshot.current;
}

export function createPlaceSnapshot(input: PlaceSnapshotInput) {
  return {
    slug: slugify(input.slugSource),
    spaceId: input.spaceId,
    name: input.name.trim(),
    world: input.world,
    category: input.category,
    coordinates: normalizeCoordinates(input.coordinates),
    description: normalizeText(input.description),
    address: input.world === 'nether' ? normalizeText(input.address) : null,
    tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
    discordUrl: normalizeText(input.discordUrl),
    images: normalizePlaceImages(input.images.map((image) => image.url)),
    offers: input.offers.map(normalizeOffer),
  };
}

export function createPortalSnapshot(input: PortalSnapshotInput) {
  const common = {
    slug: slugify(input.slugSource),
    spaceId: input.spaceId,
    name: input.name.trim(),
    description: normalizeText(input.description),
  };

  if (input.variant === 'linked') {
    return {
      ...common,
      mode: 'linked',
      overworld: normalizeCoordinates(input.linkedCoordinates.overworld),
      nether: normalizeCoordinates(input.linkedCoordinates.nether),
      netherAddress: normalizeText(input.netherAddress),
    };
  }

  return {
    ...common,
    mode: 'single',
    world: input.variant,
    coordinates: normalizeCoordinates(input.singleCoordinates),
    address: input.variant === 'nether'
      ? normalizeText(input.singleAddress)
      : null,
  };
}

function normalizeOffer(offer: FormTradeOffer) {
  const negotiable = Boolean(offer.negotiable);
  return {
    negotiable,
    description: normalizeTradeOfferDescription(offer.description),
    gives: normalizeTradeItem(offer.gives),
    wants: negotiable ? null : normalizeTradeItem(offer.wants),
  };
}

function normalizeTradeItem(item: FormTradeItem) {
  const parsedQuantity = Number.parseInt(String(item.quantity), 10);
  return {
    itemId: item.item_id.trim(),
    quantity: Number.isFinite(parsedQuantity)
      ? parsedQuantity
      : String(item.quantity).trim(),
    enchanted: Boolean(item.enchanted),
    customName: normalizeText(item.custom_name),
  };
}

function normalizeCoordinates(coordinates: CoordinatesInput) {
  return {
    x: normalizeCoordinate(coordinates.x),
    y: normalizeCoordinate(coordinates.y),
    z: normalizeCoordinate(coordinates.z),
  };
}

function normalizeCoordinate(value: string | number) {
  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? String(value).trim() : parsedValue;
}

function normalizeText(value?: string | null) {
  return value?.trim() || null;
}
