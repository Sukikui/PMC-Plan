import { z } from 'zod';

// Coordinate schema
export const CoordinateSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

// Dimension enum
export const DimensionSchema = z.enum(['overworld', 'nether', 'end']);

// Portal schema
export const PortalSchema = z.object({
  id: z.string(),
  name: z.string(),
  dimension: DimensionSchema,
  coordinates: CoordinateSchema,
  linkedPortalId: z.string().optional(), // For manual linking
  tags: z.array(z.string()).default([]),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Place schema  
export const PlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  dimension: DimensionSchema,
  coordinates: CoordinateSchema,
  tags: z.array(z.string()).default([]),
  description: z.string().optional(),
  nearestPortalId: z.string().optional(),
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
  dimension: DimensionSchema,
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
  dim: DimensionSchema,
  x: z.number(),
  y: z.number(),
  z: z.number(),
  ts: z.number(), // timestamp
});

// Export types
export type Coordinate = z.infer<typeof CoordinateSchema>;
export type Dimension = z.infer<typeof DimensionSchema>;
export type Portal = z.infer<typeof PortalSchema>;
export type Place = z.infer<typeof PlaceSchema>;
export type NetherAxis = z.infer<typeof NetherAxisSchema>;
export type PathSegment = z.infer<typeof PathSegmentSchema>;
export type Path = z.infer<typeof PathSchema>;
export type PlayerPosition = z.infer<typeof PlayerPositionSchema>;