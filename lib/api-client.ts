interface ApiErrorPayload {
  error?: string;
}

export async function requestJson<T>(
  url: string,
  init: RequestInit,
  fallbackError: string,
): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => null) as
    | (ApiErrorPayload & T)
    | null;

  if (!response.ok) {
    throw new Error(payload?.error || fallbackError);
  }

  return payload as T;
}
