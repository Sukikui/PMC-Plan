import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const placesDir = path.join(process.cwd(), 'public/data/places');
    const files = fs.readdirSync(placesDir);
    
    const places = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(placesDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const place = JSON.parse(fileContent);
        places.push(place);
      }
    }
    
    return NextResponse.json(places);
  } catch (error) {
    console.error('Error loading places:', error);
    return NextResponse.json({ error: 'Failed to load places' }, { status: 500 });
  }
}