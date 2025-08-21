import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const portalsDir = path.join(process.cwd(), 'public/data/portals');
    const files = fs.readdirSync(portalsDir);
    
    const portals = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(portalsDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const portal = JSON.parse(fileContent);
        portals.push(portal);
      }
    }
    
    return NextResponse.json(portals);
  } catch (error) {
    console.error('Error loading portals:', error);
    return NextResponse.json({ error: 'Failed to load portals' }, { status: 500 });
  }
}