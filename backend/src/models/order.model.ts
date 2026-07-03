import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const OrderHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: ["pending_payment", "payment_received", "confirmed", "processing", "failed"],
      required: true,
    },
    note: {
      type: String,
      required: true,
      trim: true,
    },
    changedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerName: {
      type: String,
      trim: true,
      default: "WhatsApp Customer",
    },
    whatsappNumber: {
      type: String,
      required: true,
      index: true,
    },
    sourceMessageId: {
      type: String,
      trim: true,
    },
    productName: {
      type: String,
      trim: true,
      default: "Catalog Product",
    },
    catalogProductId: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "PKR",
    },
    status: {
      type: String,
      enum: ["pending_payment", "payment_received", "confirmed", "processing", "failed"],
      required: true,
      default: "pending_payment",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      required: true,
      default: "pending",
    },
    paymentLink: {
      type: String,
      trim: true,
    },
    paymentGatewayReference: {
      type: String,
      trim: true,
      index: true,
    },
    history: {
      type: [OrderHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export type Order = InferSchemaType<typeof OrderSchema>;
export type OrderDocument = HydratedDocument<Order>;

export const OrderModel = model<Order>("Order", OrderSchema);
