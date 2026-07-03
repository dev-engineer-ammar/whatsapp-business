export type OrderStatus =
  | "pending_payment"
  | "payment_received"
  | "confirmed"
  | "processing"
  | "failed";

export type PaymentStatus = "pending" | "paid" | "failed";

export interface Order {
  _id: string;
  orderReference: string;
  customerName: string;
  whatsappNumber: string;
  productName: string;
  catalogProductId?: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentLink?: string;
  paymentGatewayReference?: string;
  createdAt?: string;
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  catalogProductId?: string;
  price: number;
  currency: string;
  stockQuantity: number;
  isActive: boolean;
  createdAt?: string;
}

export interface Payment {
  _id: string;
  orderReference: string;
  gatewayReference?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt?: string;
}

export interface ProductFormState {
  id: string;
  name: string;
  catalogProductId: string;
  price: string;
  stockQuantity: string;
  description: string;
  isActive: boolean;
}
