export type OrderStatus =
  | "pending_payment"
  | "payment_received"
  | "confirmed"
  | "processing"
  | "failed";

export type PaymentStatus = "pending" | "paid" | "failed";

export interface OrderHistoryEntry {
  status: OrderStatus;
  note: string;
  changedAt: Date;
}
