import { NextRequest, NextResponse } from 'next/server';
import { getPlaces } from '@/lib/data';
import { PlaceSchema } from '@/lib/schemas';
import { z } from 'zod';

const QuerySchema = z.object({
  tag: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { tag } = QuerySchema.parse({
      tag: searchParams.get('tag') || undefined,
    });

    const places = await getPlaces();
    
    // Filter by tag if provided
    const filteredPlaces = tag 
      ? places.filter(place => place.tags.includes(tag))
      : places;

    return NextResponse.json(filteredPlaces);
  } catch (error) {
    console.error('Error fetching places:', error);
    return NextResponse.json(
      { error: 'Failed to fetch places' },
      { status: 500 }
    );
  }
}