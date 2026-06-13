import { apiClient, authedRequest } from "../lib/apiClient";
import { unwrap, type ApiSuccess, type BusinessSettings } from "./types";

export type PlatformUpdateBody = Partial<{
  centerName: string;
  email: string;
  phone: string;
  address: string;
  gstPercentage: number;
  timezone: string;
  currency: string;
  language: string;
}>;

export function getPlatform() {
  return unwrap<BusinessSettings>(
    apiClient.get<ApiSuccess<BusinessSettings>>("/api/platform"),
  );
}

export function updatePlatform(body: PlatformUpdateBody) {
  return unwrap<BusinessSettings>(
    authedRequest<ApiSuccess<BusinessSettings>>("SUPERADMIN", {
      method: "PATCH",
      url: "/api/platform",
      data: body,
    }),
  );
}
