export type FoodCategory =
  | "STARTER"
  | "MAIN_COURSE"
  | "BREAD"
  | "RICE"
  | "DESSERT"
  | "BEVERAGE"
  | "SNACK"
  | "OTHER";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type PaymentMethod = "RAZORPAY" | "CASH_ON_DELIVERY";

export type UserRole = "CUSTOMER" | "RESTAURANT" | "DELIVERY_PARTNER";

export type AccountStatus = "ACTIVE" | "PENDING" | "SUSPENDED";

export interface MessageResponse {
  message: string;
  email?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  open: boolean;
  status: string;
  createdAt: string;
}

export interface FoodItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  price: number | string;
  imageUrl: string | null;
  available: boolean;
  category: FoodCategory;
  createdAt: string;
}

export interface OrderLineRequest {
  foodItemId: string;
  quantity: number;
}

export interface PlaceOrderRequest {
  restaurantId: string;
  deliveryAddress: string;
  customerNote?: string;
  items: OrderLineRequest[];
}

export interface OrderLine {
  foodItemId: string;
  foodName: string;
  unitPrice: number | string;
  quantity: number;
  subtotal: number | string;
}

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  deliveryPartnerId: string | null;
  restaurantName: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number | string;
  deliveryAddress: string;
  customerNote: string | null;
  items: OrderLine[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentOrder {
  orderId: string;
  paymentMethod: string;
  paymentStatus: string;
  amount: number | string;
  currency: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface DeliveryAddress {
  id: string;
  label: string;
  fullAddress: string;
  street: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  deliveryInstructions: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface DeliveryAddressRequest {
  label: string;
  fullAddress: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  deliveryInstructions?: string;
  isDefault?: boolean;
}

export interface CartItem {
  foodItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartState {
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  "STARTER",
  "MAIN_COURSE",
  "BREAD",
  "RICE",
  "DESSERT",
  "BEVERAGE",
  "SNACK",
  "OTHER",
];

