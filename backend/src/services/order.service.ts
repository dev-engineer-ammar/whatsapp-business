import { OrderModel, type OrderDocument } from "../models/order.model.js";
import { PaymentModel } from "../models/payment.model.js";
import { env } from "../config/env.js";
import { PaymentGatewayService } from "./payment.service.js";
import { WhatsAppService } from "./whatsapp.service.js";
import type { OrderStatus } from "../types/order.js";

interface WhatsAppMessageValue {
  contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
  messages?: Array<{
    id?: string;
    from?: string;
    type?: string;
    text?: { body?: string };
    interactive?: {
      button_reply?: { id?: string; title?: string };
    };
    order?: {
      catalog_id?: string;
      product_items?: Array<{
        product_retailer_id?: string;
        quantity?: number;
      }>;
    };
  }>;
}

export interface ManualOrderInput {
  customerName: string;
  whatsappNumber: string;
  productName: string;
  catalogProductId?: string;
  quantity?: number;
  totalAmount?: number;
}

interface CreateOrderInput {
  orderReference: string;
  customerName: string;
  whatsappNumber: string;
  sourceMessageId?: string;
  productName: string;
  catalogProductId?: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  paymentGatewayReference?: string;
  paymentLink?: string;
}

export class OrderService {
  constructor(
    private readonly paymentGatewayService: PaymentGatewayService,
    private readonly whatsAppService: WhatsAppService
  ) {}

  async createFromManualInput(input: ManualOrderInput): Promise<OrderDocument> {
    const quantity = input.quantity ?? 1;
    const totalAmount = input.totalAmount ?? env.payment.defaultAmount;
    const orderReference = this.buildOrderReference();

    const order = await this.createOrder({
      orderReference,
      customerName: input.customerName,
      whatsappNumber: input.whatsappNumber,
      productName: input.productName,
      catalogProductId: input.catalogProductId,
      quantity,
      totalAmount,
      currency: env.payment.defaultCurrency,
    });

    return this.attachPaymentLink(order);
  }

  async handleWhatsAppWebhook(body: unknown): Promise<void> {
    const changes = this.extractMessageChanges(body);

    for (const change of changes) {
      await this.processMessageValue(change);
    }
  }

  async handlePaymentWebhook(body: Record<string, unknown>): Promise<OrderDocument | null> {
    const orderReference = String(body.orderReference ?? body.orderRef ?? body.merchantOrderId ?? "");
    const gatewayReference = String(body.transactionId ?? body.txnRefNo ?? body.paymentId ?? "");
    const paymentStatus = String(body.paymentStatus ?? body.status ?? "").toLowerCase();

    if (!orderReference) {
      throw new Error("Payment webhook is missing order reference.");
    }

    if (paymentStatus !== "paid" && paymentStatus !== "success") {
      await this.recordPayment({
        orderReference,
        gatewayReference,
        status: "failed",
        rawPayload: body,
      });

      return this.updateOrderStatus(
        orderReference,
        "failed",
        "failed",
        "Payment failed or was not completed.",
        gatewayReference || undefined
      );
    }

    await this.recordPayment({
      orderReference,
      gatewayReference,
      status: "paid",
      rawPayload: body,
    });

    const paymentReceived = await this.updateOrderStatus(
      orderReference,
      "payment_received",
      "paid",
      "Payment received from gateway webhook.",
      gatewayReference || undefined
    );

    if (!paymentReceived) {
      return null;
    }

    await this.whatsAppService.sendTextMessage(
      paymentReceived.whatsappNumber,
      `Payment received for order ${paymentReceived.orderReference}.`
    );

    const confirmed = await this.updateOrderStatus(
      orderReference,
      "confirmed",
      "paid",
      "Order confirmed automatically after payment."
    );

    if (confirmed) {
      await this.whatsAppService.sendTextMessage(
        confirmed.whatsappNumber,
        `Order confirmed. We are preparing ${confirmed.productName} for delivery or processing.`
      );

      const processing = await this.updateOrderStatus(
        orderReference,
        "processing",
        "paid",
        "Order moved to processing."
      );

      if (processing) {
        await this.whatsAppService.sendTextMessage(
          processing.whatsappNumber,
          `Delivery or processing update: your order ${processing.orderReference} is now in progress.`
        );
      }
    }

    return confirmed;
  }

  private async processMessageValue(value: WhatsAppMessageValue): Promise<void> {
    const firstMessage = value.messages?.[0];

    if (!firstMessage?.from) {
      return;
    }

    const customerName = value.contacts?.[0]?.profile?.name ?? "WhatsApp Customer";
    const productItem = firstMessage.order?.product_items?.[0];
    const quantity = productItem?.quantity ?? 1;
    const productName =
      firstMessage.interactive?.button_reply?.title ??
      firstMessage.text?.body ??
      "Catalog Product";

    const order = await this.createOrder({
      orderReference: this.buildOrderReference(),
      customerName,
      whatsappNumber: firstMessage.from,
      sourceMessageId: firstMessage.id,
      productName,
      catalogProductId: productItem?.product_retailer_id ?? firstMessage.order?.catalog_id,
      quantity,
      totalAmount: env.payment.defaultAmount * quantity,
      currency: env.payment.defaultCurrency,
    });

    const orderWithPaymentLink = await this.attachPaymentLink(order);

    await this.whatsAppService.sendTextMessage(
      orderWithPaymentLink.whatsappNumber,
      [
        `Thank you ${orderWithPaymentLink.customerName}.`,
        `Your order ${orderWithPaymentLink.orderReference} has been created.`,
        `Payment link: ${orderWithPaymentLink.paymentLink}`,
      ].join(" ")
    );
  }

  private async attachPaymentLink(order: OrderDocument): Promise<OrderDocument> {
    const paymentLink = this.paymentGatewayService.createPaymentLink({
      orderReference: order.orderReference,
      amount: order.totalAmount,
      currency: order.currency,
    });

    return (
      (await this.updatePaymentLink(order.orderReference, paymentLink)) ??
      order
    );
  }

  private async createOrder(input: CreateOrderInput): Promise<OrderDocument> {
    return OrderModel.create({
      ...input,
      status: "pending_payment",
      paymentStatus: "pending",
      history: [
        {
          status: "pending_payment",
          note: "Order created from WhatsApp webhook.",
          changedAt: new Date(),
        },
      ],
    });
  }

  private async updatePaymentLink(
    orderReference: string,
    paymentLink: string
  ): Promise<OrderDocument | null> {
    return OrderModel.findOneAndUpdate({ orderReference }, { paymentLink }, { new: true }).exec();
  }

  private async updateOrderStatus(
    orderReference: string,
    status: OrderStatus,
    paymentStatus: "pending" | "paid" | "failed",
    note: string,
    paymentGatewayReference?: string
  ): Promise<OrderDocument | null> {
    return OrderModel.findOneAndUpdate(
      { orderReference },
      {
        status,
        paymentStatus,
        ...(paymentGatewayReference ? { paymentGatewayReference } : {}),
        $push: {
          history: {
            status,
            note,
            changedAt: new Date(),
          },
        },
      },
      { new: true }
    ).exec();
  }

  private async recordPayment(input: {
    orderReference: string;
    gatewayReference: string;
    status: "paid" | "failed";
    rawPayload: Record<string, unknown>;
  }): Promise<void> {
    const order = await OrderModel.findOne({ orderReference: input.orderReference }).exec();

    await PaymentModel.create({
      orderReference: input.orderReference,
      gatewayReference: input.gatewayReference,
      amount: order?.totalAmount ?? Number(input.rawPayload.amount ?? 0),
      currency: order?.currency ?? env.payment.defaultCurrency,
      status: input.status,
      rawPayload: input.rawPayload,
    });
  }

  private extractMessageChanges(body: unknown): WhatsAppMessageValue[] {
    const safeBody = body as {
      entry?: Array<{
        changes?: Array<{
          value?: WhatsAppMessageValue;
        }>;
      }>;
    };

    return (
      safeBody.entry
        ?.flatMap((entry) => entry.changes ?? [])
        .map((change) => change.value)
        .filter((value): value is WhatsAppMessageValue => Boolean(value)) ?? []
    );
  }

  private buildOrderReference(): string {
    return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}
