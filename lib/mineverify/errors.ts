export class MineVerifyServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'MineVerifyServiceError';
  }
}

export const mineVerifyNotFound = (message = 'Demande MineVerify introuvable.') =>
  new MineVerifyServiceError(message, 404);

export const mineVerifyConflict = (message: string) =>
  new MineVerifyServiceError(message, 409);
