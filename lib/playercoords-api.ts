// PlayerCoordsAPI - Client library for PlayerCoordsAPI Minecraft mod
// Documentation: https://github.com/Sukikui/PlayerCoordsAPI

export interface PlayerData {
  x: number;
  y: number;
  z: number;
  world: string;
  biome: string;
  uuid: string;
  username: string;
}

export interface PlayerCoordsApiOptions {
  /** Base URL for the PlayerCoordsAPI server (default: http://localhost:25565) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number;
}

const SAFARI_USER_AGENT_EXCLUSIONS = /Chrome|Chromium|CriOS|FxiOS|EdgiOS|OPiOS|Android/i;

export function isSafariBrowser(
  userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent
): boolean {
  return /Safari/i.test(userAgent) && !SAFARI_USER_AGENT_EXCLUSIONS.test(userAgent);
}

export function isSafariPlayerCoordsSyncBlocked(
  userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent,
  protocol = typeof location === 'undefined' ? '' : location.protocol
): boolean {
  return protocol === 'https:' && isSafariBrowser(userAgent);
}

export enum PlayerCoordsApiErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  NOT_IN_WORLD = 'NOT_IN_WORLD',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export class PlayerCoordsApiError extends Error {
  constructor(
    public type: PlayerCoordsApiErrorType,
    public originalMessage: string,
    message?: string
  ) {
    super(message || originalMessage);
    this.name = 'PlayerCoordsApiError';
  }
}

/**
 * Client for PlayerCoordsAPI Minecraft mod
 */
export class PlayerCoordsApi {
  private baseUrl: string;
  private timeout: number;

  constructor(options: PlayerCoordsApiOptions = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:25565';
    this.timeout = options.timeout || 5000;
  }

  /**
   * Get current player coordinates and world information
   * @returns Promise resolving to player data
   * @throws PlayerCoordsApiError with categorized error types
   */
  async getCoords(): Promise<PlayerData> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(`${this.baseUrl}/api/coords`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new PlayerCoordsApiError(
            PlayerCoordsApiErrorType.NOT_IN_WORLD,
            `HTTP ${response.status}: ${response.statusText}`,
            'Joueur pas dans un monde'
          );
        }

        throw new PlayerCoordsApiError(
          PlayerCoordsApiErrorType.UNKNOWN,
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data: PlayerData = await response.json();
      return data;
      
    } catch (err) {
      if (err instanceof PlayerCoordsApiError) {
        throw err;
      }
      
      const rawErrorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Handle timeout/abort errors
      if (rawErrorMessage.includes('aborted') || rawErrorMessage.includes('timeout')) {
        throw new PlayerCoordsApiError(
          PlayerCoordsApiErrorType.TIMEOUT,
          rawErrorMessage,
          'Timeout de connexion'
        );
      }
      
      // Handle JSON parsing errors
      if (rawErrorMessage.includes('JSON') || 
          rawErrorMessage.includes('Unexpected token') ||
          rawErrorMessage.includes('Expected double-quoted property name')) {
        throw new PlayerCoordsApiError(
          PlayerCoordsApiErrorType.UNKNOWN,
          rawErrorMessage,
          'Réponse invalide du serveur (format incorrect)'
        );
      }
      
      // Handle network/connection errors
      if (rawErrorMessage.includes('Failed to fetch') || 
          rawErrorMessage.includes('Load failed') ||
          rawErrorMessage.includes('NetworkError') ||
          rawErrorMessage.includes('ECONNREFUSED')) {
        throw new PlayerCoordsApiError(
          PlayerCoordsApiErrorType.CONNECTION_FAILED,
          rawErrorMessage,
          'Impossible de se connecter à l\'API'
        );
      }
      
      throw new PlayerCoordsApiError(
        PlayerCoordsApiErrorType.UNKNOWN,
        rawErrorMessage
      );
    }
  }

  /**
   * Check if PlayerCoordsAPI is available
   * @returns Promise resolving to true if API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.getCoords();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get error message in French for UI display
   */
  static getErrorMessage(error: PlayerCoordsApiError): string {
    switch (error.type) {
      case PlayerCoordsApiErrorType.NOT_IN_WORLD:
        return 'Vous n\'êtes pas dans un monde';
      case PlayerCoordsApiErrorType.CONNECTION_FAILED:
        return 'Mod non détecté';
      case PlayerCoordsApiErrorType.TIMEOUT:
        return 'Timeout de connexion';
      default:
        return 'Erreur inconnue';
    }
  }
}

// Default instance for easy usage
export const playerCoordsApi = new PlayerCoordsApi();

// Helper function for getting error messages
export const getPlayerCoordsErrorMessage = (error: PlayerCoordsApiError): string => {
  return PlayerCoordsApi.getErrorMessage(error);
};
