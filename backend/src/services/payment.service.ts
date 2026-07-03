import crypto from "node:crypto";
import { env } from "../config/env.js";

export interface PaymentLinkPayload {
  orderReference: string;
  amount: number;
  currency: string;
}

export class PaymentGatewayService {
  createPaymentLink(payload: PaymentLinkPayload): string {
    const query = new URLSearchParams({
      storeId: env.payment.storeId,
      orderRef: payload.orderReference,
      amount: payload.amount.toFixed(2),
      currency: payload.currency,
      callbackUrl: env.payment.callbackUrl,
    });

    const signature = crypto
      .createHmac("sha256", env.payment.hashKey)
      .update(query.toString())
      .digest("hex");

    query.set("signature", signature);

    return `${env.payment.baseUrl}?${query.toString()}`;
  }
}
