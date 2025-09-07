'use client';

import { useState, useEffect, useCallback } from 'react';
import { themeColors } from '../lib/theme-colors';

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
    playerPosition,
    manualCoords
}: TravelPlanProps) {
    const [route, setRoute] = useState<RouteData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const buildFromParams = useCallback(() => {
        if (playerPosition) {
            return `from_x=${playerPosition.x}&from_y=${playerPosition.y}&from_z=${playerPosition.z}&from_world=${playerPosition.world}`;
        }
        
        if (manualCoords?.x && manualCoords?.y && manualCoords?.z) {
            const x = parseFloat(manualCoords.x);
            const y = parseFloat(manualCoords.y);
            const z = parseFloat(manualCoords.z);

            if (isNaN(x) || isNaN(y) || isNaN(z)) {
                throw new Error('Coordonnées invalides');
            }

            return `from_x=${x}&from_y=${y}&from_z=${z}&from_world=${manualCoords.world}`;
        }
        
        return null;
    }, [playerPosition, manualCoords]);

    const calculateRoute = useCallback(async () => {
        if (!selectedPlaceId) return;

        try {
            const fromParams = buildFromParams();
            if (!fromParams) return;

            setLoading(true);
            setError(null);

            const url = `/api/route?${fromParams}&to_place_id=${selectedPlaceId}`;
            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur ${response.status}: ${errorText || 'Impossible de calculer l\'itinéraire'}`);
            }

            const data: RouteData = await response.json();
            setRoute(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
            setRoute(null);
        } finally {
            setLoading(false);
        }
    }, [selectedPlaceId, buildFromParams]);

    const shouldRecalculate = useCallback(() => {
        if (!route || !playerPosition || route.steps.length === 0) return true;
        
        const currentFrom = route.player_from.coordinates;
        const distance = Math.sqrt(
            Math.pow(playerPosition.x - currentFrom.x, 2) +
            Math.pow(playerPosition.y - currentFrom.y, 2) +
            Math.pow(playerPosition.z - currentFrom.z, 2)
        );

        if (distance >= 5) return true;

        const lastStepTo = route.steps[route.steps.length - 1]?.to;
        return lastStepTo?.id !== selectedPlaceId;
    }, [route, playerPosition, selectedPlaceId]);

    useEffect(() => {
        if (selectedPlaceId && (playerPosition || (manualCoords?.x && manualCoords?.y && manualCoords?.z))) {
            if (shouldRecalculate()) {
                calculateRoute();
            }
        } else {
            setRoute(null);
        }
    }, [selectedPlaceId, playerPosition, manualCoords, shouldRecalculate, calculateRoute]);

    const getStepIcon = (type: string) => {
        const iconProps = "w-4 h-4";
        const containerProps = `w-8 h-8 ${themeColors.util.roundedFull} flex items-center justify-center border-2 ${themeColors.transition}`;
        
        switch (type) {
            case 'overworld_transport':
                return (
                    <div className={`${containerProps} ${themeColors.world.overworld}`}>
                        <svg className={`${iconProps} ${themeColors.travelPlan.overworldIcon}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                    </div>
                );
            case 'nether_transport':
                return (
                    <div className={`${containerProps} ${themeColors.world.nether}`}>
                        <svg className={`${iconProps} ${themeColors.travelPlan.netherIcon}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                    </div>
                );
            case 'portal':
                return (
                    <div className={`${containerProps} ${themeColors.travelPlan.portalContainer}`}>
                        <svg className={`${iconProps} ${themeColors.travelPlan.portalIcon}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className={`${containerProps} ${themeColors.tag.display}`}>
                        <div className={`w-2 h-2 ${themeColors.text.secondary} ${themeColors.util.roundedFull}`}></div>
                    </div>
                );
        }
    };

    const getStepTitle = (step: Step) => {
        switch (step.type) {
            case 'overworld_transport':
                return (
                    <div className="flex items-center gap-2">
                        <span className={themeColors.text.secondary}>Passage</span>
                        <span className={`px-3 py-1 text-sm ${themeColors.util.roundedFull} ${themeColors.world.overworld} font-medium`}>
                            overworld
                        </span>
                    </div>
                );
            case 'nether_transport':
                return (
                    <div className="flex items-center gap-2">
                        <span className={themeColors.text.secondary}>Passage</span>
                        <span className={`px-3 py-1 text-sm ${themeColors.util.roundedFull} ${themeColors.world.nether} font-medium`}>
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

    const isUnknownPortal = (location: Step['from'] | Step['to']) => {
        return location.id !== undefined && location.id !== null && (!location.name || location.name === 'none' || location.name === '');
    };

    const isPlayerPosition = (location: Step['from'] | Step['to'], isFirstStep: boolean) => {
        return isFirstStep && !location.id;
    };

    const formatCoordinates = (coordinates: { x: number; y: number; z: number }, withFloor = true) => {
        if (withFloor) {
            return `${Math.floor(coordinates.x)}, ${Math.floor(coordinates.y)}, ${Math.floor(coordinates.z)}`;
        }
        return `${coordinates.x}, ${coordinates.y}, ${coordinates.z}`;
    };

    const getLocationDisplay = (location: Step['from'] | Step['to']) => {
        if (location.name && location.name !== 'none') {
            return location.name;
        }
        if (location.coordinates) {
            return formatCoordinates(location.coordinates, false);
        }
        return 'Position inconnue';
    };

    const getLocationStyle = (location: Step['from'] | Step['to'], isFirstStep: boolean) => {
        if (isUnknownPortal(location)) {
            return themeColors.travelPlan.unknownPortal;
        }

        if (isPlayerPosition(location, isFirstStep)) {
            return themeColors.travelPlan.playerPosition;
        }

        return themeColors.text.primary;
    };

    const getLocationText = (location: Step['from'] | Step['to'], isFirstStep: boolean) => {
        if (isUnknownPortal(location)) {
            return "Portail inconnu";
        }

        if (isPlayerPosition(location, isFirstStep)) {
            return "Position du joueur";
        }

        return getLocationDisplay(location);
    };

    const renderWorldBadge = (world: string) => {
        return (
            <span className={`px-2 py-1 text-xs ${themeColors.util.roundedFull} border ${
                world === 'overworld' ? themeColors.world.overworld : themeColors.world.nether
            }`}>
                {world}
            </span>
        );
    };

    const renderNetherAddress = (stepType: string, address?: string) => {
        if (stepType === 'nether_transport' && address) {
            return (
                <span className={`ml-3 px-2 py-1 ${themeColors.util.roundedFull} ${themeColors.travelPlan.netherAddress} text-xs font-semibold`}>
                    {address}
                </span>
            );
        }
        return null;
    };

    const getIconContainer = (iconType: 'default' | 'position' | 'error') => {
        switch(iconType) {
            case 'position': return themeColors.ui.positionIconContainer;
            case 'error': return themeColors.ui.errorIconContainer;
            default: return themeColors.ui.iconContainer;
        }
    };

    const renderEmptyState = (icon: JSX.Element, title: string, description: string, bgClass: string, iconType: 'default' | 'position' | 'error' = 'default') => (
        <div className={`absolute inset-0 ${bgClass} flex items-center justify-center ${themeColors.transition}`}>
            <div className="text-center max-w-md">
                <div className={`w-16 h-16 mx-auto mb-6 ${themeColors.util.roundedFull} ${getIconContainer(iconType)} flex items-center justify-center ${themeColors.transition}`}>
                    {icon}
                </div>
                <h2 className={`text-xl font-bold ${themeColors.text.primary} mb-3 ${themeColors.transition}`}>{title}</h2>
                <p className={`${themeColors.text.secondary} ${themeColors.transition}`}>{description}</p>
            </div>
        </div>
    );

    if (!selectedPlaceId) {
        return renderEmptyState(
            <svg className={`w-8 h-8 ${themeColors.travelPlan.routeIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
            </svg>,
            "Planification d'itinéraire",
            "Sélectionnez une destination dans le panneau de gauche",
            themeColors.mainScreen.noDestination
        );
    }

    if (loading) {
        return renderEmptyState(
            <div className={`w-12 h-12 border-4 ${themeColors.border.tertiary} ${themeColors.travelPlan.spinnerTop} ${themeColors.util.roundedFull} ${themeColors.util.animateSpin} ${themeColors.transition}`}></div>,
            "Calcul en cours...",
            "Recherche du meilleur itinéraire",
            themeColors.mainScreen.noDestination
        );
    }

    if (error) {
        return renderEmptyState(
            <svg className={`w-8 h-8 ${themeColors.travelPlan.errorIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>,
            "Erreur de calcul",
            error,
            themeColors.mainScreen.error,
            'error'
        );
    }

    if (!route) {
        return renderEmptyState(
            <svg className={`w-8 h-8 ${themeColors.travelPlan.positionIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>,
            "Position requise",
            "Synchronisez-vous avec le mod PlayerCoordsAPI ou indiquez manuellement vos coordonnées",
            themeColors.mainScreen.noPosition,
            'position'
        );
    }

    return (
        <div className={`absolute inset-0 ${themeColors.mainScreen.routeActive} ${themeColors.transition}`}>
            <div className="absolute inset-0 left-[25rem] right-[21rem] overflow-y-auto">
                <div className="p-6 min-h-full flex flex-col justify-center">
                    <div className="w-full max-w-2xl mx-auto">
                        {/* Total distance display */}
                        <div className="text-center mb-8">
                            <div className={`inline-flex items-center gap-3 ${themeColors.panel.tertiary} ${themeColors.blurSm} ${themeColors.util.roundedFull} px-6 py-3 ${themeColors.shadow.panel} border ${themeColors.border.secondary}`}>
                                <div className={`text-2xl font-bold ${themeColors.text.primary}`}>{route.total_distance.toFixed(0)}</div>
                                <div className={`text-sm ${themeColors.text.secondary} ${themeColors.util.uppercase}`}>blocs au total</div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {route.steps.filter(step => step.type !== 'portal' && step.distance && step.distance > 0).map((step, index) => (
                                <div key={index} className="flex items-start gap-3 justify-center">
                                    <div className="flex flex-col items-center flex-shrink-0">
                                        <div className="transform scale-110">
                                            {getStepIcon(step.type)}
                                        </div>
                                        {index < route.steps.length - 1 && (
                                            <div className={`w-0.5 h-6 ${themeColors.ui.stepConnector} mt-2`}></div>
                                        )}
                                    </div>
                                    <div className={`flex-1 min-w-0 max-w-lg ${themeColors.panel.tertiary} ${themeColors.blurSm} ${themeColors.util.roundedXl} p-4 ${themeColors.shadow.panel} border ${themeColors.border.secondary}`}>
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                            <h3 className={`font-bold ${themeColors.text.primary}`}>{getStepTitle(step)}</h3>
                                            {step.distance && (
                                                <span className={`${themeColors.text.tertiary} text-xs`}>
                                                    {step.distance.toFixed(0)} blocs
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                {/* From */}
                                                <div className="flex-1 min-w-0">
                                                    <div className={`${themeColors.text.secondary} text-xs font-semibold ${themeColors.util.uppercase} mb-1`}>De</div>
                                                    <div className={`font-medium mb-1 ${getLocationStyle(step.from, index === 0)}`}>
                                                        {getLocationText(step.from, index === 0)}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {step.from.world && renderWorldBadge(step.from.world)}
                                                        {(step.from.coordinates || (index === 0 && route.player_from.coordinates)) && (
                                                            <span className={`text-sm ${themeColors.text.secondary} font-medium`}>
                                                                {isUnknownPortal(step.from) ? '~ ' : ''}
                                                                {step.from.coordinates
                                                                    ? formatCoordinates(step.from.coordinates)
                                                                    : formatCoordinates(route.player_from.coordinates)
                                                                }
                                                                {renderNetherAddress(step.type, step.from.address)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Arrow */}
                                                <div className="mx-4">
                                                    <svg className={`w-6 h-6 ${themeColors.text.secondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                </div>

                                                {/* To */}
                                                <div className="flex-1 min-w-0 text-right">
                                                    <div className={`${themeColors.text.secondary} text-xs font-semibold ${themeColors.util.uppercase} mb-1`}>À</div>
                                                    <div className={`font-medium mb-1 ${getLocationStyle(step.to, false)}`} title={getLocationDisplay(step.to)}>
                                                        {isUnknownPortal(step.to)
                                                            ? "Portail inconnu"
                                                            : (step.type === 'portal' && (step.to.id === undefined || step.to.id === null || step.to.id === '') && step.to.coordinates)
                                                                ? `~ ${formatCoordinates(step.to.coordinates, false)}`
                                                                : getLocationDisplay(step.to)
                                                        }
                                                    </div>
                                                    <div className="flex items-center justify-end gap-2">
                                                        {step.to.world && renderWorldBadge(step.to.world)}
                                                        {step.to.coordinates && (
                                                            <span className={`text-sm ${themeColors.text.secondary} font-medium`}>
                                                                {isUnknownPortal(step.to) ? '~ ' : ''}
                                                                {formatCoordinates(step.to.coordinates, false)}
                                                                {renderNetherAddress(step.type, step.to.address)}
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