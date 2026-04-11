/**
 * Converts a relative upload path (e.g. /uploads/avatars/uuid.webp)
 * to an absolute URL using the backend origin — NOT the API base URL,
 * because ServeStaticModule serves files outside the /api prefix.
 */
const BACKEND_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/api\/?$/, '');

export function uploadUrl(path: string): string {
  return `${BACKEND_URL}${path}`;
}
