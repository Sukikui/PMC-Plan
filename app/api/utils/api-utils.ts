import { NextResponse } from 'next/server';
import { z } from 'zod';

export function handleError(error: unknown, message: string) {
  console.error(message, error);
  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
}

export function parseQueryParams<T extends z.ZodSchema>(
  requestUrl: string,
  schema: T
): z.infer<T> {
  const { searchParams } = new URL(requestUrl);
  const params: Record<string, string> = {};
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return schema.parse(params);
}

export const sanitizeOwners = (owners?: string[]) =>
  Array.from(new Set((owners ?? []).map((owner) => owner.trim()).filter(Boolean)));

export const sanitizeTags = (tags?: string[]) =>
  Array.from(new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean)));
