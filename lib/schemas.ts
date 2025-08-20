import { z } from 'zod';

// Coordinate schema
export const CoordinateSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

// World enum (renamed from Dimension)
export const WorldSchema = z.enum(['overworld', 'nether']);

// Maintain backward compatibility
export const DimensionSchema = WorldSchema;

// Portal schema
export const PortalSchema = z.object({
  id: z.string(),
  name: z.string(),
  world: WorldSchema,
  coordinates: CoordinateSchema,
  description: z.string().optional(),
});

// Place schema  
export const PlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  world: WorldSchema,
  coordinates: CoordinateSchema,
  tags: z.array(z.string()).default([]),
  description: z.string().optional(),
});

// Nether axis schema
export const NetherAxisSchema = z.object({
  id: z.string(),
  name: z.string(),
  direction: z.enum(['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest']),
  startCoordinates: CoordinateSchema,
  endCoordinates: CoordinateSchema,
  connectedPortals: z.array(z.string()).default([]), // Portal IDs
  tunnelWidth: z.number().default(3),
  isMainAxis: z.boolean().default(false),
});

// Path segment for routing
export const PathSegmentSchema = z.object({
  type: z.enum(['walk', 'portal', 'axis']),
  dimension: WorldSchema,
  coordinates: CoordinateSchema,
  portalId: z.string().optional(),
  axisId: z.string().optional(),
  distance: z.number(),
  instructions: z.string().optional(),
});

// Complete path schema
export const PathSchema = z.object({
  segments: z.array(PathSegmentSchema),
  totalDistance: z.number(),
  estimatedTime: z.number().optional(), // in seconds
  startCoordinates: CoordinateSchema,
  endCoordinates: CoordinateSchema,
});

// Player position from localhost
export const PlayerPositionSchema = z.object({
  dim: WorldSchema,
  x: z.number(),
  y: z.number(),
  z: z.number(),
  ts: z.number(), // timestamp
});

// Export types
export type Coordinate = z.infer<typeof CoordinateSchema>;
export type World = z.infer<typeof WorldSchema>;
export type Dimension = z.infer<typeof DimensionSchema>; // Backward compatibility
export type Portal = z.infer<typeof PortalSchema>;
export type Place = z.infer<typeof PlaceSchema>;
export type NetherAxis = z.infer<typeof NetherAxisSchema>;
export type PathSegment = z.infer<typeof PathSegmentSchema>;
export type Path = z.infer<typeof PathSchema>;
export type PlayerPosition = z.infer<typeof PlayerPositionSchema>;