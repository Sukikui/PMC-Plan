import { Portal } from './schemas';
import { overworldToNether, netherToOverworld, calculate2DDistance } from './coords';

// Maximum distance to consider portals as linked (in blocks)
const PORTAL_LINK_THRESHOLD = 128;

export interface PortalLink {
  overworldPortal: Portal;
  netherPortal: Portal;
  distance: number;
  isManualLink: boolean;
}

export function linkPortals(portals: Portal[]): PortalLink[] {
  const links: PortalLink[] = [];
  const overworldPortals = portals.filter(p => p.dimension === 'overworld');
  const netherPortals = portals.filter(p => p.dimension === 'nether');
  const usedNetherPortals = new Set<string>();
  const usedOverworldPortals = new Set<string>();

  // First pass: Handle manual links
  for (const owPortal of overworldPortals) {
    if (owPortal.linkedPortalId && !usedOverworldPortals.has(owPortal.id)) {
      const netherPortal = netherPortals.find(p => p.id === owPortal.linkedPortalId);
      if (netherPortal && !usedNetherPortals.has(netherPortal.id)) {
        links.push({
          overworldPortal: owPortal,
          netherPortal,
          distance: 0, // Manual links have priority
          isManualLink: true,
        });
        usedOverworldPortals.add(owPortal.id);
        usedNetherPortals.add(netherPortal.id);
      }
    }
  }

  // Second pass: Handle manual links from nether side
  for (const netherPortal of netherPortals) {
    if (netherPortal.linkedPortalId && !usedNetherPortals.has(netherPortal.id)) {
      const owPortal = overworldPortals.find(p => p.id === netherPortal.linkedPortalId);
      if (owPortal && !usedOverworldPortals.has(owPortal.id)) {
        links.push({
          overworldPortal: owPortal,
          netherPortal,
          distance: 0, // Manual links have priority
          isManualLink: true,
        });
        usedOverworldPortals.add(owPortal.id);
        usedNetherPortals.add(netherPortal.id);
      }
    }
  }

  // Third pass: Auto-link remaining portals based on coordinate matching
  for (const owPortal of overworldPortals) {
    if (usedOverworldPortals.has(owPortal.id) || !owPortal.isActive) continue;

    // Convert overworld coordinates to nether scale
    const expectedNetherCoord = overworldToNether(owPortal.coordinates);
    
    let bestMatch: Portal | null = null;
    let bestDistance = Infinity;

    for (const netherPortal of netherPortals) {
      if (usedNetherPortals.has(netherPortal.id) || !netherPortal.isActive) continue;

      // Calculate distance between expected nether position and actual nether portal
      const distance = calculate2DDistance(expectedNetherCoord, netherPortal.coordinates);
      
      if (distance <= PORTAL_LINK_THRESHOLD && distance < bestDistance) {
        bestMatch = netherPortal;
        bestDistance = distance;
      }
    }

    if (bestMatch) {
      links.push({
        overworldPortal: owPortal,
        netherPortal: bestMatch,
        distance: bestDistance,
        isManualLink: false,
      });
      usedOverworldPortals.add(owPortal.id);
      usedNetherPortals.add(bestMatch.id);
    }
  }

  return links.sort((a, b) => {
    // Manual links first, then by distance
    if (a.isManualLink && !b.isManualLink) return -1;
    if (!a.isManualLink && b.isManualLink) return 1;
    return a.distance - b.distance;
  });
}

// Get the linked portal for a given portal ID
export function getLinkedPortal(portalId: string, links: PortalLink[]): Portal | null {
  const link = links.find(link => 
    link.overworldPortal.id === portalId || link.netherPortal.id === portalId
  );
  
  if (!link) return null;
  
  return link.overworldPortal.id === portalId 
    ? link.netherPortal 
    : link.overworldPortal;
}

// Check if two portals are linked
export function arePortalsLinked(portal1Id: string, portal2Id: string, links: PortalLink[]): boolean {
  return links.some(link => 
    (link.overworldPortal.id === portal1Id && link.netherPortal.id === portal2Id) ||
    (link.overworldPortal.id === portal2Id && link.netherPortal.id === portal1Id)
  );
}

// Get all unlinked portals
export function getUnlinkedPortals(portals: Portal[], links: PortalLink[]): Portal[] {
  const linkedPortalIds = new Set<string>();
  
  links.forEach(link => {
    linkedPortalIds.add(link.overworldPortal.id);
    linkedPortalIds.add(link.netherPortal.id);
  });
  
  return portals.filter(portal => !linkedPortalIds.has(portal.id) && portal.isActive);
}

// Validate portal links (check for conflicts or issues)
export function validatePortalLinks(links: PortalLink[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const usedOverworldPortals = new Set<string>();
  const usedNetherPortals = new Set<string>();
  
  for (const link of links) {
    // Check for duplicate overworld portals
    if (usedOverworldPortals.has(link.overworldPortal.id)) {
      errors.push(`Overworld portal ${link.overworldPortal.name} is linked multiple times`);
    } else {
      usedOverworldPortals.add(link.overworldPortal.id);
    }
    
    // Check for duplicate nether portals
    if (usedNetherPortals.has(link.netherPortal.id)) {
      errors.push(`Nether portal ${link.netherPortal.name} is linked multiple times`);
    } else {
      usedNetherPortals.add(link.netherPortal.id);
    }
    
    // Check for large distances in auto-linked portals
    if (!link.isManualLink && link.distance > PORTAL_LINK_THRESHOLD / 2) {
      errors.push(`Auto-linked portals ${link.overworldPortal.name} and ${link.netherPortal.name} are far apart (${link.distance.toFixed(0)} blocks)`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}