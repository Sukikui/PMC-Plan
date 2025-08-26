'use client';

interface Step {
  type: string;
  [key: string]: any;
}

interface PathData {
  steps: Step[];
  total_distance: number;
}

interface Map2DProps {
  pathData: PathData | null;
}

export default function Map2D({ pathData }: Map2DProps) {
  return (
    <div className="relative w-full h-full bg-gray-800 flex items-center justify-center">
      <div className="text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Map Placeholder</h2>
        <p>Map will be implemented later</p>
        {pathData && (
          <div className="mt-4 p-4 bg-gray-700 rounded">
            <p>Route calculated: {pathData.steps?.length || 0} steps</p>
            <p>Total distance: {pathData.total_distance?.toFixed(1)} blocks</p>
          </div>
        )}
      </div>
    </div>
  );
}