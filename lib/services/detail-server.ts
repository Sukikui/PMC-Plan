import { prisma } from '@/lib/prisma';
import {
  serviceDetailCacheTag,
} from '@/lib/content/cache-tags';
import { serviceInclude, toService } from './serialization';
import { cacheDatabaseQuery } from '@/lib/cache/database-cache';

export function loadServiceDetail(slug: string) {
  return cacheDatabaseQuery(
    async () => {
      const service = await prisma.service.findUnique({
        where: { slug },
        include: serviceInclude,
      });
      return service ? toService(service) : null;
    },
    ['service-detail-v1', slug],
    {
      revalidate: 300,
      tags: [serviceDetailCacheTag(slug)],
    },
  )();
}
