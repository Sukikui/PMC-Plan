import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  serviceDetailCacheTag,
} from '@/lib/content/cache-tags';
import { serviceInclude, toService } from './serialization';

export function loadServiceDetail(slug: string) {
  return unstable_cache(
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
