const CDN = (import.meta.env.VITE_CDN_ENDPOINT ?? "").replace(/\/+$/, "");
const PREFIX = (import.meta.env.VITE_AWS_S3_FILE_PREFIX ?? "").replace(/^\/+|\/+$/g, "");

export function resolveMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const normalised = path.startsWith("/") ? path : `/${path}`;
  const segment = PREFIX ? `/${PREFIX}` : "";
  return `${CDN}${segment}${normalised}`;
}
