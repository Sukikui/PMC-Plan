import { NextResponse } from 'next/server';
import { loadPlaces } from '../utils/shared';
import { handleError } from '../utils/api-utils';

export async function GET() {
  try {
    const places = await loadPlaces();
    return NextResponse.json(places);
  } catch (error) {
    // The loadPlaces function already logs warnings for individual file errors.
    // This catch block will handle more critical errors, like the directory not existing.
    return handleError(error, 'Failed to load places');
  }
}
