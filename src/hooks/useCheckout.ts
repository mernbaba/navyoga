import { useCallback } from "react";
import { useRazorpay } from "react-razorpay";
import {
  initiatePayment,
  verifyPayment,
  getPaymentStatus,
  type InitiatePaymentInput,
} from "../api/payments";

// Shared "initiate → Razorpay → verify" checkout flow. Extracted from the
// inlined block in UserPayments so the renew modal (and eventually the plans
// page, events, workshops) can run an identical, single-source-of-truth flow.

export type CheckoutOutcome =
  | { status: "paid" }
  | { status: "free" } // 100%-off coupon: backend fulfilled inline, no gateway
  | { status: "dismissed" }; // user closed the Razorpay modal

export type CheckoutOptions = {
  // Shown as the Razorpay order description; also used in nothing else.
  description: string;
};

// The dismissal sentinel mirrors UserPayments' original inline flow.
const DISMISSED = "__dismissed__";

export function useCheckout() {
  const { Razorpay } = useRazorpay();

  const checkout = useCallback(
    async (input: InitiatePaymentInput, opts: CheckoutOptions): Promise<CheckoutOutcome> => {
      const paymentData = await initiatePayment("STUDENT", input);

      // Free order: a 100%-off coupon (or discount ≥ price) dropped the charge
      // below Razorpay's ₹1 minimum, so the backend already fulfilled the
      // enrollment and returned no gateway key/order. Opening Razorpay here would
      // throw "No key passed" — skip checkout and report success.
      if (paymentData.free) {
        return { status: "free" };
      }

      // A non-free order must carry gateway credentials. Guard so the fields are
      // narrowed to non-undefined for the Razorpay options (which require them).
      if (!paymentData.key || paymentData.amount == null || !paymentData.orderId) {
        throw new Error("Payment could not be started. Please try again.");
      }
      const { key, amount, orderId } = paymentData;

      document.body.style.overflow = "hidden";
      try {
        await new Promise<void>((resolve, reject) => {
          const rzp = new Razorpay({
            key,
            amount,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            currency: paymentData.currency as any,
            order_id: orderId,
            name: "Navyoga",
            description: opts.description,
            handler: async (response) => {
              try {
                await verifyPayment("STUDENT", {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
                resolve();
              } catch (err) {
                // Razorpay already confirmed the payment (we're in its success
                // handler) — a thrown error here means our own /verify call
                // failed (dropped network, etc.), not that the payment failed.
                // Ask the backend to check directly with Razorpay before
                // surfacing an error the user would wrongly read as "charged
                // but nothing happened."
                const reconciled = await getPaymentStatus(
                  "STUDENT",
                  paymentData.paymentRecordId,
                ).catch(() => null);
                if (reconciled?.status === "PAID") {
                  resolve();
                } else {
                  reject(err);
                }
              }
            },
            modal: {
              // A dismiss can, in rare cases (e.g. the browser backgrounding
              // mid-redirect), fire after Razorpay has actually captured the
              // payment. Confirm with the backend before treating it as a
              // cancelled checkout.
              ondismiss: () => {
                void getPaymentStatus("STUDENT", paymentData.paymentRecordId)
                  .catch(() => null)
                  .then((reconciled) => {
                    if (reconciled?.status === "PAID") {
                      resolve();
                    } else {
                      reject(new Error(DISMISSED));
                    }
                  });
              },
            },
          });
          rzp.open();
        });
      } catch (err) {
        if (err instanceof Error && err.message === DISMISSED) {
          return { status: "dismissed" };
        }
        throw err;
      } finally {
        document.body.style.overflow = "";
      }

      return { status: "paid" };
    },
    [Razorpay],
  );

  return checkout;
}
