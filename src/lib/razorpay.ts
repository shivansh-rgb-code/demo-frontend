import { toPaise } from "./format";
import type { PaymentOrder, UserProfile } from "../types";

export interface RazorpaySuccessPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessPayload) => void;
  prefill?: { name?: string };
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

export function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay Checkout")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Razorpay Checkout"));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(options: {
  payment: PaymentOrder;
  profile: UserProfile | null;
  onSuccess: (payload: RazorpaySuccessPayload) => void;
  onDismiss: () => void;
}): Promise<void> {
  if (!options.payment.razorpayKeyId || !options.payment.razorpayOrderId) {
    throw new Error(
      "The backend did not return Razorpay checkout credentials. Payment cannot start.",
    );
  }

  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error("Razorpay Checkout is unavailable in this browser.");
  }

  const checkout = new window.Razorpay({
    key: options.payment.razorpayKeyId,
    amount: toPaise(options.payment.amount),
    currency: options.payment.currency || "INR",
    name: "Food Delivery",
    description: `Order ${options.payment.orderId}`,
    order_id: options.payment.razorpayOrderId,
    prefill: options.profile ? { name: options.profile.fullName } : undefined,
    handler: options.onSuccess,
    modal: { ondismiss: options.onDismiss },
  });

  checkout.open();
}
