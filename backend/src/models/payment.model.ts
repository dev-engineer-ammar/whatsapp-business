import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const PaymentSchema = new Schema(
  {
    orderReference: {
      type: String,
      required: true,
      index: true,
    },
    gatewayReference: {
      type: String,
      trim: true,
      index: true,
    },
    amount: {
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
      enum: ["pending", "paid", "failed"],
      required: true,
      default: "pending",
      index: true,
    },
    rawPayload: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export type Payment = InferSchemaType<typeof PaymentSchema>;
export type PaymentDocument = HydratedDocument<Payment>;

export const PaymentModel = model<Payment>("Payment", PaymentSchema);
