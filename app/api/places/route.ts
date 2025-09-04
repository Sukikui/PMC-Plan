import { NextResponse } from 'next/server';
import { loadPlaces } from '../utils/shared';

export async function GET() {
  try {
    const places = await loadPlaces();
    return NextResponse.json(places);
  } catch (error) {
    // The loadPlaces function already logs warnings for individual file errors.
    // This catch block will handle more critical errors, like the directory not existing.
    console.error('Failed to load places via shared function:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load places',
        details: 'Une erreur est survenue lors du chargement des lieux.' 
      }, 
      { status: 500 }
    );
  }
}
