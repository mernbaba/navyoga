const CDN_RAW = import.meta.env.VITE_CDN_ENDPOINT as string | undefined;
const PREFIX_RAW = import.meta.env.VITE_AWS_S3_FILE_PREFIX as string | undefined;

if (!CDN_RAW) {
  throw new Error("VITE_CDN_ENDPOINT is not set");
}
if (!PREFIX_RAW) {
  throw new Error("VITE_AWS_S3_FILE_PREFIX is not set");
}

const CDN = CDN_RAW.replace(/\/+$/, "");
const PREFIX = PREFIX_RAW.replace(/^\/+|\/+$/g, "");

export function extractRelativePath(path: string | null | undefined): string {
  if (!path) return "";
  if (/^(data:|blob:)/i.test(path)) return path;
  if (/^https?:/i.test(path)) {
    const prefixed = PREFIX ? `${CDN}/${PREFIX}/` : `${CDN}/`;
    if (path.startsWith(prefixed)) return path.slice(prefixed.length);
    if (path.startsWith(`${CDN}/`)) return path.slice(CDN.length + 1);
    return path;
  }
  return path.startsWith("/") ? path.slice(1) : path;
}

// Stored path of the shared default avatar. A student with no avatar has
// `avatar: null` in the DB — the default is never persisted, only resolved here.
export const DEFAULT_AVATAR_PATH = "/avatars/default.webp";

// Resolve a student/staff avatar path to a displayable URL, falling back to the
// shared default avatar (BASEURL/PREFIX/avatars/default.webp) when none is set.
export function resolveAvatarUrl(path: string | null | undefined): string {
  return resolveMediaUrl(path) ?? resolveMediaUrl(DEFAULT_AVATAR_PATH)!;
}

export function resolveMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^(data:|blob:)/i.test(path)) return path;
  if (/^https?:/i.test(path)) {
    // If a full URL pointing at our CDN was stored without the prefix segment,
    // inject it so the object resolves to the correct S3 key.
    if (PREFIX && CDN && path.startsWith(`${CDN}/`)) {
      const tail = path.slice(CDN.length + 1);
      if (!tail.startsWith(`${PREFIX}/`) && tail !== PREFIX) {
        return `${CDN}/${PREFIX}/${tail}`;
      }
    }
    return path;
  }

  const normalised = path.startsWith("/") ? path : `/${path}`;
  const segment = PREFIX ? `/${PREFIX}` : "";
  return `${CDN}${segment}${normalised}`;
}
