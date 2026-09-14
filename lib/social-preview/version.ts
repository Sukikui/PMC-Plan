import { createHash } from 'node:crypto';

export function createSocialPreviewVersion(content: unknown) {
  return createHash('sha256')
    .update(JSON.stringify(content))
    .digest('hex')
    .slice(0, 16);
}
