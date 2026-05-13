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
