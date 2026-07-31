import type { ManagedIdentity } from './ManagedUsersField';

interface SessionIdentity {
  globalName?: string | null;
  id: string;
  image?: string | null;
  name?: string | null;
  username?: string | null;
}

export function toManagedIdentity(user: SessionIdentity): ManagedIdentity {
  return {
    id: user.id,
    image: user.image ?? null,
    name: user.globalName ?? user.name ?? null,
    username: user.username ?? null,
  };
}

export function appendUniqueManagedUser<T extends { id: string }>(
  users: T[],
  user: T,
) {
  return users.some(({ id }) => id === user.id)
    ? users
    : [...users, user];
}

export function removeManagedUser<T extends { id: string }>(
  users: T[],
  userId: string,
) {
  return users.filter(({ id }) => id !== userId);
}
