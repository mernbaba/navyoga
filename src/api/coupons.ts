import { authedRequest } from "../lib/apiClient";
import {
  unwrap,
  type ApiSuccess,
  type Coupon,
  type CouponApplicableType,
  type CouponStatus,
  type DiscountType,
  type Paginated,
  type Role,
} from "./types";

export type CouponValidateBody = {
  code: string;
  type: "SELF_PACED" | "LIVE" | "YTT_LIVE" | "YTT_RECORDED" | "EVENT" | "WORKSHOP";
  planId?: string;
  courseId?: string;
  batchId?: string;
  entityId?: string;
  // When upgrading, preview the discount against the upgrade base (plan price
  // minus the unused-days credit) so it matches the eventual charge.
  isUpgrade?: boolean;
};

export type CouponValidateResponse = {
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
};

export function validateCoupon(role: Role, body: CouponValidateBody) {
  return unwrap<CouponValidateResponse>(
    authedRequest<ApiSuccess<CouponValidateResponse>>(role, {
      method: "POST",
      url: "/api/coupons/validate",
      data: body,
    }),
  );
}

export type CouponListParams = {
  q?: string;
  status?: CouponStatus;
  discountType?: DiscountType;
  page?: number;
  limit?: number;
};

export type CouponCreateBody = {
  code: string;
  discountType: DiscountType;
  discountValue: number | string;
  minPurchaseAmount: number | string;
  usageLimit: number;
  validFrom: string;
  expiryDate: string;
  description?: string;
  maxDiscount?: number | string | null;
  usageCount?: number;
  status?: CouponStatus;
  // Empty array or omitted = applies to all plan types
  applicableTo?: CouponApplicableType[];
};

export type CouponUpdateBody = {
  code?: string;
  description?: string | null;
  discountType?: DiscountType;
  discountValue?: number | string;
  maxDiscount?: number | string | null;
  minPurchaseAmount?: number | string;
  usageLimit?: number;
  usageCount?: number;
  validFrom?: string;
  expiryDate?: string;
  status?: CouponStatus;
  applicableTo?: CouponApplicableType[];
};

export function listCoupons(role: Role, params: CouponListParams = {}) {
  return unwrap<Paginated<Coupon>>(
    authedRequest<ApiSuccess<Paginated<Coupon>>>(role, {
      method: "GET",
      url: "/api/coupons",
      params,
    }),
  );
}

export function getCoupon(role: Role, id: string) {
  return unwrap<Coupon>(
    authedRequest<ApiSuccess<Coupon>>(role, {
      method: "GET",
      url: `/api/coupons/${id}`,
    }),
  );
}

export function createCoupon(role: Role, body: CouponCreateBody) {
  return unwrap<Coupon>(
    authedRequest<ApiSuccess<Coupon>>(role, {
      method: "POST",
      url: "/api/coupons",
      data: body,
    }),
  );
}

export function updateCoupon(role: Role, id: string, body: CouponUpdateBody) {
  return unwrap<Coupon>(
    authedRequest<ApiSuccess<Coupon>>(role, {
      method: "PATCH",
      url: `/api/coupons/${id}`,
      data: body,
    }),
  );
}

export function deleteCoupon(role: Role, id: string) {
  return unwrap<null>(
    authedRequest<ApiSuccess<null>>(role, {
      method: "DELETE",
      url: `/api/coupons/${id}`,
    }),
  );
}
