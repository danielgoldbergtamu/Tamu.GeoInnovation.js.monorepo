/**
 * The API's own reason for refusing a request, else `fallback` (#2966).
 *
 * A Nest error body is `{ statusCode, message, error }`, where `message` is one string ("The photo must be a PNG or
 * JPEG image", "Submissions closed on …" from #2934) or, from validation, a list of them. Only a refusal (4xx) is
 * read: a 5xx message such as "Internal server error" is not a reason anyone can act on, and a body that is text,
 * such as a proxy's 413 page, has no message. Accepts anything a subscription's `error` callback is given.
 */
export function serverMessage(err: unknown, fallback: string): string {
  const response = err as { status?: unknown; error?: unknown } | null | undefined;
  const status = response?.status;

  if (typeof status !== 'number' || status < 400 || status >= 500) {
    return fallback;
  }

  const body = response.error;
  const message = body !== null && typeof body === 'object' ? (body as { message?: unknown }).message : undefined;
  const lines = (Array.isArray(message) ? message : [message]).filter(
    (line): line is string => typeof line === 'string' && line.trim().length > 0
  );

  return lines.length > 0 ? lines.join('; ') : fallback;
}

/**
 * What an admin page says when a request fails (#3038): for a 403, that the account lacks the permission, naming it when
 * the API says which, and who adds it, never "try again", which cannot help; for a 401, to sign in again; otherwise the
 * page's own words. `what` finishes "doesn't have permission to ...", such as "read check-ins".
 */
export function requestFailure(err: unknown, words: { what: string; fallback: string }): string {
  const response = err as { status?: unknown; error?: unknown } | null | undefined;

  if (response?.status === 401) {
    return 'Your sign-in has expired. Sign out and sign in again, then try again.';
  }

  if (response?.status === 403) {
    const body = response.error;
    const named = body !== null && typeof body === 'object' ? (body as { permissions?: unknown }).permissions : undefined;
    const permissions = Array.isArray(named) ? named.filter((p): p is string => typeof p === 'string' && p.length > 0) : [];
    const which = permissions.length > 0 ? ` (${permissions.join(' or ')})` : '';

    return `Your account doesn't have permission to ${words.what}${which}. An administrator adds it in Auth0; then sign out and back in.`;
  }

  return words.fallback;
}
