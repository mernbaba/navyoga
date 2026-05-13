const DEFAULT_CDN = "https://navyoga.s3.ap-south-1.amazonaws.com";
const DEFAULT_PREFIX = "assets";

const CDN = ((import.meta.env.VITE_CDN_ENDPOINT as string | undefined) || DEFAULT_CDN).replace(/\/+$/, "");
const PREFIX = ((import.meta.env.VITE_AWS_S3_FILE_PREFIX as string | undefined) || DEFAULT_PREFIX).replace(/^\/+|\/+$/g, "");

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
