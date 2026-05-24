const PROVIDER_SRC = "https://verify.msg91.com/otp-provider.js";
const WIDGET_ID = import.meta.env.VITE_MSG91_WIDGET_ID;
const TOKEN_AUTH = import.meta.env.VITE_MSG91_TOKEN_AUTH;

if (!WIDGET_ID || !TOKEN_AUTH) {
  throw new Error("MSG91 env vars missing");
}

export const SMS_CHANNEL = "11";

type Msg91Configuration = {
  widgetId: string;
  tokenAuth: string;
  exposeMethods: true;
  identifier?: string;
  captchaRenderId?: string;
  success?: (data: unknown) => void;
  failure?: (error: unknown) => void;
};

type SendOtpFn = (
  identifier: string,
  onSuccess?: (data: unknown) => void,
  onFailure?: (error: unknown) => void,
) => void;

type VerifyOtpFn = (
  otp: string | number,
  onSuccess?: (data: unknown) => void,
  onFailure?: (error: unknown) => void,
  reqId?: string,
) => void;

type RetryOtpFn = (
  channel: string | null,
  onSuccess?: (data: unknown) => void,
  onFailure?: (error: unknown) => void,
  reqId?: string,
) => void;

declare global {
  interface Window {
    initSendOTP?: (configuration: Msg91Configuration) => void;
    sendOtp?: SendOtpFn;
    verifyOtp?: VerifyOtpFn;
    retryOtp?: RetryOtpFn;
    getWidgetData?: () => unknown;
    isCaptchaVerified?: () => boolean;
  }
}

let scriptLoading: Promise<void> | null = null;
let initPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === "undefined")
    return Promise.reject(new Error("no window"));
  if (window.initSendOTP) return Promise.resolve();
  if (scriptLoading) return scriptLoading;

  scriptLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PROVIDER_SRC}"]`,
    );
    if (existing) {
      if (window.initSendOTP) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load MSG91 widget")),
        { once: true },
      );
      return;
    }
    const tag = document.createElement("script");
    tag.src = PROVIDER_SRC;
    tag.async = true;
    tag.onload = () => resolve();
    tag.onerror = () => reject(new Error("Failed to load MSG91 widget"));
    document.body.appendChild(tag);
  });

  return scriptLoading;
}

function waitForExposedMethods(timeoutMs = 20000): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const tick = () => {
      if (window.sendOtp && window.verifyOtp && window.retryOtp) {
        resolve();
        return;
      }
      if (Date.now() > deadline) {
        reject(
          new Error(
            "MSG91 widget didn't initialize. Check the widget ID / token auth and that the dashboard widget is published.",
          ),
        );
        return;
      }
      setTimeout(tick, 100);
    };
    tick();
  });
}

const CAPTCHA_RENDER_ID = "msg91-captcha-target";

function ensureCaptchaTarget(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(CAPTCHA_RENDER_ID)) return;
  const div = document.createElement("div");
  div.id = CAPTCHA_RENDER_ID;
  div.style.position = "fixed";
  div.style.bottom = "12px";
  div.style.right = "12px";
  div.style.zIndex = "9999";
  document.body.appendChild(div);
}

// SMS-only channel for the first sendOtp is configured on the MSG91 dashboard
// for this widgetId — the widget API has no per-call channel arg for sendOtp.
// initSendOTP exposes window.sendOtp/verifyOtp/retryOtp asynchronously (the
// bundle lazy-loads hCaptcha and Angular sub-modules), with no ready callback,
// so we poll. captchaRenderId points to a hidden div so hCaptcha has a mount
// point even if the dashboard widget has captcha enabled — without it the
// widget hangs without exposing methods.
export async function initMsg91(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    await loadScript();
    if (!window.initSendOTP) {
      throw new Error("MSG91 initSendOTP unavailable after script load");
    }
    ensureCaptchaTarget();
    window.initSendOTP({
      widgetId: WIDGET_ID,
      tokenAuth: TOKEN_AUTH,
      exposeMethods: true,
      captchaRenderId: CAPTCHA_RENDER_ID,
      success: () => {},
      failure: () => {},
    });
    await waitForExposedMethods();
  })().catch((err) => {
    initPromise = null;
    throw err;
  });
  return initPromise;
}

export type OtpFailure = { message: string; raw: unknown };

function toFailure(err: unknown): OtpFailure {
  if (err && typeof err === "object") {
    const maybe = err as { message?: unknown; type?: unknown };
    if (typeof maybe.message === "string") {
      return { message: maybe.message, raw: err };
    }
    if (typeof maybe.type === "string") {
      return { message: maybe.type, raw: err };
    }
  }
  if (typeof err === "string") return { message: err, raw: err };
  return { message: "OTP request failed", raw: err };
}

export async function sendOtp(identifier: string): Promise<void> {
  await initMsg91();
  if (!window.sendOtp) throw new Error("MSG91 sendOtp not exposed");
  return new Promise((resolve, reject) => {
    window.sendOtp!(
      identifier,
      () => resolve(),
      (err) => reject(toFailure(err)),
    );
  });
}

export async function retryOtp(): Promise<void> {
  await initMsg91();
  if (!window.retryOtp) throw new Error("MSG91 retryOtp not exposed");
  return new Promise((resolve, reject) => {
    window.retryOtp!(
      SMS_CHANNEL,
      () => resolve(),
      (err) => reject(toFailure(err)),
    );
  });
}

// Returns the MSG91 access-token; the BE forwards it to /verifyAccessToken.
export async function verifyOtp(otp: string): Promise<string> {
  await initMsg91();
  if (!window.verifyOtp) throw new Error("MSG91 verifyOtp not exposed");
  return new Promise((resolve, reject) => {
    window.verifyOtp!(
      otp,
      (data) => {
        const token = extractAccessToken(data);
        if (!token) {
          reject({
            message: "OTP verified but no access token returned",
            raw: data,
          });
          return;
        }
        resolve(token);
      },
      (err) => reject(toFailure(err)),
    );
  });
}

function extractAccessToken(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as { message?: unknown };
  return typeof obj.message === "string" ? obj.message : null;
}
