'use client';

import { useState, useEffect } from 'react';

interface Step {
    type: 'overworld_transport' | 'nether_transport' | 'portal';
    distance?: number;
    from: {
        id?: string;
        name?: string;
        coordinates?: { x: number; y: number; z: number };
        world?: string;
        address?: string;
    };
    to: {
        id?: string;
        name?: string;
        coordinates?: { x: number; y: number; z: number };
        world?: string;
        address?: string;
    };
}

interface RouteData {
    player_from: {
        coordinates: { x: number; y: number; z: number };
        world: string;
    };
    total_distance: number;
    steps: Step[];
}

interface TravelPlanProps {
    selectedPlaceId?: string;
    selectedPlaceType?: 'place' | 'portal';
    playerPosition?: {
        x: number;
        y: number;
        z: number;
        world: string;
    } | null;
    manualCoords?: {
        x: string;
        y: string;
        z: string;
        world: 'overworld' | 'nether';
    };
}

export default function TravelPlan({
                                       selectedPlaceId,
                                       selectedPlaceType,
                                       playerPosition,
                                       manualCoords
                                   }: TravelPlanProps) {
    const [route, setRoute] = useState<RouteData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const calculateRoute = async () => {
        if (!selectedPlaceId) return;

        // Determine source coordinates
        let fromParams = '';
        console.log('Player position:', playerPosition);
        console.log('Manual coords:', manualCoords);

        if (playerPosition) {
            fromParams = `from_x=${playerPosition.x}&from_y=${playerPosition.y}&from_z=${playerPosition.z}&from_world=${playerPosition.world}`;
        } else if (manualCoords && manualCoords.x && manualCoords.y && manualCoords.z) {
            // Convert string coordinates to numbers
            const x = parseFloat(manualCoords.x);
            const y = parseFloat(manualCoords.y);
            const z = parseFloat(manualCoords.z);

            // Check if conversion was successful
            if (isNaN(x) || isNaN(y) || isNaN(z)) {
                setError('Coordonnées invalides');
                return;
            }

            fromParams = `from_x=${x}&from_y=${y}&from_z=${z}&from_world=${manualCoords.world}`;
        } else {
            console.log('No valid coordinates available');
            return;
        }

        console.log('From params:', fromParams);

        setLoading(true);
        setError(null);

        try {
            const url = `/api/route?${fromParams}&to_place_id=${selectedPlaceId}`;
            console.log('Route request URL:', url);

            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Route API error:', response.status, errorText);
                throw new Error(`Erreur ${response.status}: ${errorText || 'Impossible de calculer l\'itinéraire'}`);
            }

            const data: RouteData = await response.json();
            console.log('Route response:', data);
            // Log all step data to understand structure
            data.steps.forEach((step, i) => {
                console.log(`Step ${i} (${step.type}):`, {
                    from: step.from,
                    to: step.to
                });
            });
            setRoute(data);
        } catch (err) {
            console.error('Route calculation error:', err);
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
            setRoute(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedPlaceId && (playerPosition || (manualCoords?.x && manualCoords?.y && manualCoords?.z))) {
            // Always recalculate when selectedPlaceId changes (new place/portal selected)
            // Only optimize for player movement if the destination hasn't changed
            if (route && playerPosition && route.steps.length > 0) {
                // Check if this is just a player position update (same destination)
                const currentFrom = route.player_from.coordinates;
                const distance = Math.sqrt(
                    Math.pow(playerPosition.x - currentFrom.x, 2) +
                    Math.pow(playerPosition.y - currentFrom.y, 2) +
                    Math.pow(playerPosition.z - currentFrom.z, 2)
                );

                // Don't recalculate if player moved less than 5 blocks AND destination is the same
                if (distance < 5) {
                    // But we still need to recalculate if the selectedPlaceId changed
                    const lastStepTo = route.steps[route.steps.length - 1]?.to;
                    if (lastStepTo?.id === selectedPlaceId) {
                        return; // Same destination and small player movement, skip recalculation
                    }
                }
            }

            calculateRoute();
        } else {
            setRoute(null);
        }
    }, [selectedPlaceId, playerPosition, manualCoords]);

    const getStepIcon = (type: string) => {
        switch (type) {
            case 'overworld_transport':
                return (
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-800/40 rounded-full flex items-center justify-center border-2 border-green-200 dark:border-green-700 transition-colors duration-300">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                    </div>
                );
            case 'nether_transport':
                return (
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-800/40 rounded-full flex items-center justify-center border-2 border-red-200 dark:border-red-700 transition-colors duration-300">
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                    </div>
                );
            case 'portal':
                return (
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800/40 rounded-full flex items-center justify-center border-2 border-purple-200 dark:border-purple-700 transition-colors duration-300">
                        <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 transition-colors duration-300">
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full"></div>
                    </div>
                );
        }
    };

    const getStepTitle = (step: Step) => {
        switch (step.type) {
            case 'overworld_transport':
                return (
                    <div className="flex items-center gap-2">
                        <span>Passage</span>
                        <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-700 border border-green-200 font-medium">
              overworld
            </span>
                    </div>
                );
            case 'nether_transport':
                return (
                    <div className="flex items-center gap-2">
                        <span>Passage</span>
                        <span className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-700 border border-red-200 font-medium">
              nether
            </span>
                    </div>
                );
            case 'portal':
                return '';
            default:
                return 'Étape';
        }
    };

    const getLocationDisplay = (location: Step['from'] | Step['to']) => {
        if (location.name) {
            return location.name;
        }
        if (location.coordinates) {
            return `${location.coordinates.x}, ${location.coordinates.y}, ${location.coordinates.z}`;
        }
        return 'Position inconnue';
    };

    const getLocationDisplayForStep = (location: Step['from'] | Step['to'], stepType: string) => {
        // If it's a portal/place (has id), prioritize name (but check if name is meaningful)
        if (location.id && location.name && location.name !== 'none') {
            return location.name;
        }
        // For nether transport, use address if available and no meaningful name
        if (stepType === 'nether_transport' && location.address) {
            return location.address;
        }
        // If it has a meaningful name without id (fallback)
        if (location.name && location.name !== 'none') {
            return location.name;
        }
        // If no name but has coordinates, show coordinates
        if (location.coordinates) {
            return `${location.coordinates.x}, ${location.coordinates.y}, ${location.coordinates.z}`;
        }
        return 'Position inconnue';
    };

    if (!selectedPlaceId) {
        return (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 dark:from-blue-950/20 via-white dark:via-gray-900 to-indigo-100 dark:to-indigo-900/20 flex items-center justify-center transition-colors duration-300">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 dark:from-blue-800/30 to-indigo-100 dark:to-indigo-800/30 flex items-center justify-center transition-colors duration-300">
                        <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">Planification d'itinéraire</h2>
                    <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                        Sélectionnez une destination dans le panneau de gauche
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 dark:from-blue-950/20 via-white dark:via-gray-900 to-indigo-100 dark:to-indigo-900/20 flex items-center justify-center transition-colors duration-300">
                <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-6 border-4 border-blue-200 dark:border-blue-700 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin transition-colors duration-300"></div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">Calcul en cours...</h2>
                    <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">Recherche du meilleur itinéraire</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 dark:from-red-950 via-white dark:via-gray-900 to-pink-50 dark:to-pink-950 flex items-center justify-center transition-colors duration-300">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 dark:from-red-800/30 to-pink-100 dark:to-pink-800/30 flex items-center justify-center transition-colors duration-300">
                        <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-3 transition-colors duration-300">Erreur de calcul</h2>
                    <p className="text-red-700 dark:text-red-300 transition-colors duration-300">{error}</p>
                </div>
            </div>
        );
    }

    if (!route) {
        return (
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 dark:from-yellow-950 via-white dark:via-gray-900 to-orange-50 dark:to-orange-950 flex items-center justify-center transition-colors duration-300">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-100 dark:from-yellow-800/30 to-orange-100 dark:to-orange-800/30 flex items-center justify-center transition-colors duration-300">
                        <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 transition-colors duration-300">Position requise</h2>
                    <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                        Synchronisez-vous avec le mod PlayerCoordsAPI<br />
                        ou indiquez manuellement vos coordonnées
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 bg-gradient-to-br from-green-100 dark:from-green-950 via-white dark:via-gray-900 to-blue-100 dark:to-blue-950 transition-colors duration-300">
            {/* Center content between left panel (w-96) and right panel (w-80) */}
            <div className="absolute inset-0 left-[25rem] right-[21rem] overflow-y-auto">
                <div className="p-6 min-h-full flex flex-col justify-center">
                    <div className="w-full max-w-2xl mx-auto">
                        {/* Total distance display */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-white/60">
                                <div className="text-2xl font-bold text-gray-900">{route.total_distance.toFixed(0)}</div>
                                <div className="text-sm text-gray-600 uppercase tracking-wide">blocs au total</div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Route Steps */}
                            {route.steps.filter(step => step.type !== 'portal').map((step, index) => (
                                <div key={index} className="flex items-start gap-3 justify-center">
                                    <div className="flex flex-col items-center flex-shrink-0">
                                        <div className="transform scale-110">
                                            {getStepIcon(step.type)}
                                        </div>
                                        {index < route.steps.length - 1 && (
                                            <div className="w-0.5 h-6 bg-gradient-to-b from-gray-300 to-gray-300 mt-2"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 max-w-lg bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/60">
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                            <h3 className="font-bold text-gray-900">{getStepTitle(step)}</h3>
                                            {step.distance && (
                                                <span className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                          {step.distance.toFixed(1)} blocs
                        </span>
                                            )}
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-1">De</div>
                                                    {/* Show nether address for nether transport - bigger and more prominent at top */}
                                                    {step.type === 'nether_transport' && step.from.address && (
                                                        <div className="text-sm text-purple-700 font-medium mb-1">
                                                            📍 {step.from.address}
                                                        </div>
                                                    )}
                                                    <div className={`font-medium mb-1 ${
                                                        index === 0 && (!step.from.name && !step.from.coordinates)
                                                            ? "text-green-600"
                                                            : "text-gray-900"
                                                    }`}>
                                                        {/* For first step, use player starting point if step.from is empty */}
                                                        {index === 0 && (!step.from.name && !step.from.coordinates)
                                                            ? "Position du joueur"
                                                            : getLocationDisplayForStep(step.from, step.type)
                                                        }
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {/* For first step, use player world if step.from.world is missing */}
                                                        {(step.from.world || (index === 0 && route.player_from.world)) && (
                                                            <span className={`px-2 py-1 text-xs rounded-full border ${
                                                                (step.from.world || route.player_from.world) === 'overworld'
                                                                    ? 'bg-green-100 text-green-700 border-green-100'
                                                                    : 'bg-red-100 text-red-700 border-red-100'
                                                            }`}>
                                {step.from.world || route.player_from.world}
                              </span>
                                                        )}
                                                        {/* For first step, use player coordinates if step.from.coordinates is missing */}
                                                        {(step.from.coordinates || (index === 0 && route.player_from.coordinates)) && (
                                                            <span className="text-xs text-gray-500">
                                {step.from.coordinates
                                    ? `${Math.floor(step.from.coordinates.x)}, ${Math.floor(step.from.coordinates.y)}, ${Math.floor(step.from.coordinates.z)}`
                                    : `${Math.floor(route.player_from.coordinates.x)}, ${Math.floor(route.player_from.coordinates.y)}, ${Math.floor(route.player_from.coordinates.z)}`
                                }
                              </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mx-4">
                                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                </div>

                                                <div className="flex-1 min-w-0 text-right">
                                                    <div className="text-gray-600 text-xs font-semibold uppercase tracking-wide mb-1">À</div>
                                                    {/* Show nether address for nether transport - bigger and more prominent at top */}
                                                    {step.type === 'nether_transport' && step.to.address && (
                                                        <div className="text-sm text-purple-700 font-medium mb-1 text-right">
                                                            📍 {step.to.address}
                                                        </div>
                                                    )}
                                                    <div className="text-gray-900 font-medium mb-1" title={getLocationDisplayForStep(step.to, step.type)}>
                                                        {getLocationDisplayForStep(step.to, step.type)}
                                                    </div>
                                                    <div className="flex items-center justify-end gap-2">
                                                        {step.to.world && (
                                                            <span className={`px-2 py-1 text-xs rounded-full border ${
                                                                step.to.world === 'overworld'
                                                                    ? 'bg-green-100 text-green-700 border-green-100'
                                                                    : 'bg-red-100 text-red-700 border-red-100'
                                                            }`}>
                                {step.to.world}
                              </span>
                                                        )}
                                                        {step.to.coordinates && (
                                                            <span className="text-xs text-gray-500">
                                {step.to.coordinates.x}, {step.to.coordinates.y}, {step.to.coordinates.z}
                              </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}