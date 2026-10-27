import { api, getApiBaseUrl } from "./client";
import type {
  DeliveryAddress,
  DeliveryAddressRequest,
  FoodCategory,
  FoodItem,
  MessageResponse,
  Order,
  PaymentMethod,
  PaymentOrder,
  PlaceOrderRequest,
  Restaurant,
  UserProfile,
  VerifyPaymentRequest,
} from "../types";

export function login(email: string, password: string) {
  return api<MessageResponse>("/api/auth/customer/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signup(name: string, email: string, password: string) {
  return api<MessageResponse>("/api/auth/customer/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function verifyOtp(email: string, token: string) {
  return api<MessageResponse>("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, token }),
  });
}

export function resendOtp(email: string) {
  return api<MessageResponse>("/api/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function logout() {
  return api<MessageResponse>("/api/auth/logout", { method: "POST" });
}

export function getSocialLoginUrl(provider: "google" | "facebook") {
  return `${getApiBaseUrl()}/api/auth/${provider}`;
}

export function getMe() {
  return api<UserProfile>("/api/customer/me");
}

export function listRestaurants(query?: string, openOnly?: boolean) {
  const params = new URLSearchParams();
  if (query?.trim()) params.set("q", query.trim());
  if (openOnly) params.set("open", "true");
  const suffix = params.toString() ? `?${params}` : "";
  return api<Restaurant[]>(`/api/customer/restaurants${suffix}`);
}

export function getRestaurant(restaurantId: string) {
  return api<Restaurant>(`/api/customer/restaurants/${restaurantId}`);
}

export function listFoodItems(
  restaurantId: string,
  query?: string,
  category?: FoodCategory | "",
) {
  const params = new URLSearchParams();
  if (query?.trim()) params.set("q", query.trim());
  if (category) params.set("category", category);
  const suffix = params.toString() ? `?${params}` : "";
  return api<FoodItem[]>(
    `/api/customer/restaurants/${restaurantId}/food-items${suffix}`,
  );
}

export function placeOrder(request: PlaceOrderRequest, paymentMethod: PaymentMethod) {
  const params = new URLSearchParams({ paymentMethod });
  return api<Order>(`/api/customer/orders?${params}`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function listOrders() {
  return api<Order[]>("/api/customer/orders");
}

export function getOrder(orderId: string) {
  return api<Order>(`/api/customer/orders/${orderId}`);
}

export function createPaymentOrder(orderId: string) {
  return api<PaymentOrder>(`/api/customer/orders/${orderId}/payment`, {
    method: "POST",
  });
}

export function verifyPayment(orderId: string, payload: VerifyPaymentRequest) {
  return api<{ message: string; orderId: string; paymentStatus: string }>(
    `/api/customer/orders/${orderId}/payment/verify`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function listAddresses() {
  return api<DeliveryAddress[]>("/api/customer/addresses");
}

export function createAddress(request: DeliveryAddressRequest) {
  return api<DeliveryAddress>("/api/customer/addresses", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function updateAddress(id: string, request: DeliveryAddressRequest) {
  return api<DeliveryAddress>(`/api/customer/addresses/${id}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function deleteAddress(id: string) {
  return api<void>(`/api/customer/addresses/${id}`, {
    method: "DELETE",
  });
}

export function setDefaultAddress(id: string) {
  return api<DeliveryAddress>(`/api/customer/addresses/${id}/default`, {
    method: "PATCH",
  });
}

export function getProfile() {
  return api<UserProfile>("/api/profiles/me");
}

export function updateProfile(fullName: string) {
  return api<UserProfile>("/api/profiles/me", {
    method: "PUT",
    body: JSON.stringify({ fullName }),
  });
}