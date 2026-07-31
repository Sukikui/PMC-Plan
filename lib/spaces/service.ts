import { Prisma } from '@prisma/client';
import {
  canAdministerContent,
  canContribute,
  canManageContent,
} from '@/lib/content-permissions';
import { prisma } from '@/lib/prisma';
import { runSerializableTransaction } from '@/lib/prisma/transaction';
import { spaceInclude, toSpace } from './serialization';
import type {
  SpaceActor,
  SpaceInput,
  SpaceUpdateInput,
} from './types';

export class SpaceError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export async function listSpaces() {
  const spaces = await prisma.space.findMany({
    include: spaceInclude,
    orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
  });
  return spaces.map(toSpace);
}

export async function getSpace(slug: string) {
  const space = await prisma.space.findUnique({
    where: { slug },
    include: spaceInclude,
  });
  return space ? toSpace(space) : null;
}

export function createSpace(actor: SpaceActor, input: SpaceInput) {
  requireContributor(actor);
  return runSerializableTransaction(async (tx) => {
    const managerIds = await validateManagers(
      tx,
      input.managerIds,
      actor.userId,
    );
    const space = await tx.space.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description,
        color: input.color,
        logoUrl: input.logoUrl,
        logoBackground: input.logoBackground,
        logoZoom: input.logoZoom,
        discordUrl: input.discordUrl,
        primaryManagerId: actor.userId,
        lastEditorId: actor.userId,
        managers: managerIds.length
          ? { create: managerIds.map((userId) => ({ userId })) }
          : undefined,
      },
      include: spaceInclude,
    });
    return toSpace(space);
  });
}

export function updateSpace(
  slug: string,
  actor: SpaceActor,
  input: SpaceUpdateInput,
) {
  return runSerializableTransaction(async (tx) => {
    const current = await requireSpace(tx, slug);
    requireEditAccess(actor, current);

    const canEditTeam = canAdministerContent(
      actor.role,
      actor.userId,
      current.primaryManagerId,
    );
    const managerIds = canEditTeam
      ? await validateManagers(tx, input.managerIds, current.primaryManagerId)
      : current.managers.map(({ userId }) => userId);

    const space = await tx.space.update({
      where: { id: current.id },
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description,
        color: input.color,
        logoUrl: input.logoUrl,
        logoBackground: input.logoBackground,
        logoZoom: input.logoZoom,
        discordUrl: input.discordUrl,
        lastEditorId: actor.userId,
        managers: canEditTeam
          ? {
              deleteMany: {},
              create: managerIds.map((userId) => ({ userId })),
            }
          : undefined,
      },
      include: spaceInclude,
    });
    return toSpace(space);
  });
}

export function deleteSpace(slug: string, actor: SpaceActor) {
  return runSerializableTransaction(async (tx) => {
    const current = await requireSpace(tx, slug);
    if (!canAdministerContent(
      actor.role,
      actor.userId,
      current.primaryManagerId,
    )) {
      throw new SpaceError(
        'Seul le gestionnaire principal peut supprimer cet espace.',
        403,
      );
    }
    await tx.space.delete({ where: { id: current.id } });
  });
}

export function transferSpace(
  slug: string,
  actor: SpaceActor,
  nextPrimaryManagerId: string,
  confirmation: string,
) {
  return runSerializableTransaction(async (tx) => {
    const current = await requireSpace(tx, slug);
    if (!canAdministerContent(
      actor.role,
      actor.userId,
      current.primaryManagerId,
    )) {
      throw new SpaceError(
        'Seul le gestionnaire principal peut transférer cet espace.',
        403,
      );
    }
    if (nextPrimaryManagerId === current.primaryManagerId) {
      return toSpace(await tx.space.findUniqueOrThrow({
        where: { id: current.id },
        include: spaceInclude,
      }));
    }

    const nextPrimary = await tx.user.findUnique({
      where: { id: nextPrimaryManagerId },
      select: { role: true, username: true },
    });
    if (!nextPrimary || !canContribute(nextPrimary.role)) {
      throw new SpaceError(
        'Ce compte ne peut pas devenir gestionnaire principal.',
        400,
      );
    }
    if (
      !nextPrimary.username
      || confirmation !== `@${nextPrimary.username}`
    ) {
      throw new SpaceError(
        'La confirmation ne correspond pas à l’identifiant Discord.',
        400,
      );
    }

    await tx.spaceManager.deleteMany({
      where: { spaceId: current.id, userId: nextPrimaryManagerId },
    });
    await tx.spaceManager.upsert({
      where: {
        spaceId_userId: {
          spaceId: current.id,
          userId: current.primaryManagerId,
        },
      },
      create: {
        spaceId: current.id,
        userId: current.primaryManagerId,
      },
      update: {},
    });
    const space = await tx.space.update({
      where: { id: current.id },
      data: {
        primaryManagerId: nextPrimaryManagerId,
        lastEditorId: actor.userId,
      },
      include: spaceInclude,
    });
    return toSpace(space);
  });
}

interface SpaceAccessRecord {
  id: string;
  primaryManagerId: string;
  managers: Array<{ userId: string }>;
}

async function requireSpace(
  tx: Prisma.TransactionClient,
  slug: string,
): Promise<SpaceAccessRecord> {
  const space = await tx.space.findUnique({
    where: { slug },
    select: {
      id: true,
      primaryManagerId: true,
      managers: { select: { userId: true } },
    },
  });
  if (!space) throw new SpaceError('Espace introuvable.', 404);
  return space;
}

function requireContributor(actor: SpaceActor) {
  if (!actor.userId || !canContribute(actor.role)) {
    throw new SpaceError('Compte approuvé requis.', 403);
  }
}

function requireEditAccess(actor: SpaceActor, space: SpaceAccessRecord) {
  if (!canManageContent(actor.role, actor.userId, {
    primaryManagerId: space.primaryManagerId,
    managerIds: space.managers.map(({ userId }) => userId),
  })) {
    throw new SpaceError('Tu ne peux pas modifier cet espace.', 403);
  }
}

async function validateManagers(
  tx: Prisma.TransactionClient,
  requestedIds: string[],
  primaryManagerId: string,
) {
  const managerIds = Array.from(new Set(requestedIds))
    .filter((userId) => userId !== primaryManagerId);
  if (managerIds.length === 0) return managerIds;

  const managers = await tx.user.findMany({
    where: { id: { in: managerIds } },
    select: { id: true, role: true },
  });
  if (
    managers.length !== managerIds.length
    || managers.some(({ role }) => !canContribute(role))
  ) {
    throw new SpaceError(
      'Un gestionnaire sélectionné ne peut pas gérer de contenu.',
      400,
    );
  }
  return managerIds;
}
