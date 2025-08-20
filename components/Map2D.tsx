'use client';

import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

interface PlayerPosition {
  dim: 'overworld' | 'nether' | 'end';
  x: number;
  y: number;
  z: number;
  ts: number;
}

interface Map2DProps {
  playerPos: PlayerPosition | null;
  pathData: any;
}

export default function Map2D({ playerPos, pathData }: Map2DProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const playerSpriteRef = useRef<PIXI.Graphics | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize PixiJS application
    const app = new PIXI.Application({
      width: 800,
      height: 600,
      backgroundColor: 0x2c3e50,
      antialias: true,
    });

    canvasRef.current.appendChild(app.canvas as HTMLCanvasElement);
    appRef.current = app;

    // Create player sprite
    const playerSprite = new PIXI.Graphics();
    playerSprite.beginFill(0x3498db);
    playerSprite.drawCircle(0, 0, 8);
    playerSprite.endFill();
    playerSpriteRef.current = playerSprite;
    app.stage.addChild(playerSprite);

    // Create grid background
    const grid = new PIXI.Graphics();
    grid.lineStyle(1, 0x34495e, 0.3);
    
    for (let x = 0; x < 800; x += 50) {
      grid.moveTo(x, 0);
      grid.lineTo(x, 600);
    }
    for (let y = 0; y < 600; y += 50) {
      grid.moveTo(0, y);
      grid.lineTo(800, y);
    }
    
    app.stage.addChildAt(grid, 0);

    return () => {
      app.destroy(true);
    };
  }, []);

  // Update player position
  useEffect(() => {
    if (!playerPos || !playerSpriteRef.current) return;

    // Convert Minecraft coordinates to screen coordinates
    // Simple scaling: divide by 10 and center
    const screenX = (playerPos.x / 10) + 400;
    const screenZ = (playerPos.z / 10) + 300;

    playerSpriteRef.current.x = screenX;
    playerSpriteRef.current.y = screenZ;
  }, [playerPos]);

  // Render path data
  useEffect(() => {
    if (!pathData || !appRef.current) return;

    // Remove existing path graphics
    const existingPath = appRef.current.stage.getChildByName('path');
    if (existingPath) {
      appRef.current.stage.removeChild(existingPath);
    }

    // Draw new path
    const pathGraphics = new PIXI.Graphics();
    pathGraphics.name = 'path';
    pathGraphics.lineStyle(3, 0xe74c3c, 1);

    if (pathData.segments && pathData.segments.length > 0) {
      let isFirst = true;
      
      pathData.segments.forEach((segment: any) => {
        const screenX = (segment.x / 10) + 400;
        const screenZ = (segment.z / 10) + 300;

        if (isFirst) {
          pathGraphics.moveTo(screenX, screenZ);
          isFirst = false;
        } else {
          pathGraphics.lineTo(screenX, screenZ);
        }

        // Draw portals as special markers
        if (segment.type === 'portal') {
          const portalSprite = new PIXI.Graphics();
          portalSprite.beginFill(0x9b59b6);
          portalSprite.drawRect(-6, -6, 12, 12);
          portalSprite.endFill();
          portalSprite.x = screenX;
          portalSprite.y = screenZ;
          pathGraphics.addChild(portalSprite);
        }
      });
    }

    appRef.current.stage.addChild(pathGraphics);
  }, [pathData]);

  return (
    <div className="relative w-full h-full bg-gray-900">
      <div ref={canvasRef} className="w-full h-full" />
      {playerPos && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded">
          <div>Dimension: {playerPos.dim}</div>
          <div>X: {playerPos.x.toFixed(0)}</div>
          <div>Y: {playerPos.y.toFixed(0)}</div>
          <div>Z: {playerPos.z.toFixed(0)}</div>
        </div>
      )}
    </div>
  );
}