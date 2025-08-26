import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const placesDir = path.join(process.cwd(), 'public/data/places');
    
    // Check if directory exists
    if (!fs.existsSync(placesDir)) {
      console.error('Places directory not found:', placesDir);
      return NextResponse.json({ 
        error: 'Places directory not found',
        details: 'Le répertoire des lieux est introuvable sur le serveur'
      }, { status: 500 });
    }

    let files;
    try {
      files = fs.readdirSync(placesDir);
    } catch (dirError) {
      console.error('Error reading places directory:', dirError);
      return NextResponse.json({ 
        error: 'Cannot read places directory',
        details: 'Impossible de lire le répertoire des lieux'
      }, { status: 500 });
    }
    
    const places = [];
    const failedFiles = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(placesDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const place = JSON.parse(fileContent);
          
          // Basic validation
          if (!place.id || !place.name || !place.world || !place.coordinates) {
            console.warn(`Invalid place data in file: ${file}`);
            failedFiles.push(file);
            continue;
          }
          
          places.push(place);
        } catch (fileError) {
          console.error(`Error processing place file ${file}:`, fileError);
          failedFiles.push(file);
        }
      }
    }

    // Log warnings for failed files but don't fail the entire request
    if (failedFiles.length > 0) {
      console.warn(`Failed to load ${failedFiles.length} place files:`, failedFiles);
    }
    
    return NextResponse.json(places);
  } catch (error) {
    console.error('Unexpected error loading places:', error);
    return NextResponse.json({ 
      error: 'Unexpected server error',
      details: 'Une erreur inattendue est survenue lors du chargement des lieux'
    }, { status: 500 });
  }
}