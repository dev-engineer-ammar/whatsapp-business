import { OrderModel, type OrderDocument } from "../models/order.model.js";
import { PaymentModel } from "../models/payment.model.js";
import { ProductModel } from "../models/product.model.js";
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
        name?: string;
        quantity?: number;
      }>;
    };
  }>;
}

interface ParsedOrderItem {
  catalogProductId?: string;
  name?: string;
  quantity: number;
}

interface PricedOrderSummary {
  productName: string;
  catalogProductId?: string;
  quantity: number;
  totalAmount: number;
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
    const fallbackProductName =
      firstMessage.interactive?.button_reply?.title ??
      firstMessage.text?.body ??
      "Catalog Product";
    const pricedOrder = await this.buildPricedOrderSummary(firstMessage, fallbackProductName);

    const order = await this.createOrder({
      orderReference: this.buildOrderReference(),
      customerName,
      whatsappNumber: firstMessage.from,
      sourceMessageId: firstMessage.id,
      productName: pricedOrder.productName,
      catalogProductId: pricedOrder.catalogProductId,
      quantity: pricedOrder.quantity,
      totalAmount: pricedOrder.totalAmount,
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

    const cloudApiChanges =
      safeBody.entry
        ?.flatMap((entry) => entry.changes ?? [])
        .map((change) => change.value)
        .filter((value): value is WhatsAppMessageValue => Boolean(value)) ?? [];

    if (cloudApiChanges.length) {
      return cloudApiChanges;
    }

    const watiMessageValue = this.extractWatiMessageValue(body);
    return watiMessageValue ? [watiMessageValue] : [];
  }

  private extractWatiMessageValue(body: unknown): WhatsAppMessageValue | null {
    if (!body || typeof body !== "object") {
      return null;
    }

    const payload = body as Record<string, unknown>;
    const nestedPayload = this.getRecord(payload.payload) ?? this.getRecord(payload.data) ?? payload;
    const whatsappNumber = this.getFirstString(
      nestedPayload.waId,
      nestedPayload.whatsappNumber,
      nestedPayload.phone,
      nestedPayload.from,
      nestedPayload.sender,
      this.getRecord(nestedPayload.contact)?.waId,
      this.getRecord(nestedPayload.contact)?.phone
    );

    if (!whatsappNumber) {
      return null;
    }

    const textBody = this.getFirstString(
      nestedPayload.text,
      nestedPayload.message,
      nestedPayload.body,
      this.getRecord(nestedPayload.text)?.body,
      this.getRecord(nestedPayload.message)?.text
    );
    const orderRecord = this.getRecord(nestedPayload.order);
    const orderItems = this.getArray(
      orderRecord?.product_items,
      orderRecord?.items,
      nestedPayload.product_items,
      nestedPayload.productItems,
      nestedPayload.orderItems,
      nestedPayload.items
    );

    return {
      contacts: [
        {
          profile: {
            name:
              this.getFirstString(
                nestedPayload.senderName,
                nestedPayload.sender_name,
                this.getRecord(nestedPayload.contact)?.name
              ) ?? "WhatsApp Customer",
          },
          wa_id: whatsappNumber,
        },
      ],
      messages: [
        {
          id: this.getFirstString(nestedPayload.id, nestedPayload.messageId, nestedPayload.message_id),
          from: whatsappNumber,
          type: this.getFirstString(nestedPayload.type, nestedPayload.eventType),
          text: textBody ? { body: textBody } : undefined,
          order: orderItems.length
            ? {
                catalog_id: this.getFirstString(orderRecord?.catalog_id, orderRecord?.catalogId),
                product_items: orderItems
                  .map((item) => this.getRecord(item))
                  .filter((item): item is Record<string, unknown> => Boolean(item))
                  .map((item) => ({
                    product_retailer_id: this.getFirstString(
                      item.product_retailer_id,
                      item.productRetailerId,
                      item.catalogProductId,
                      item.productId,
                      item.sku,
                      item.id
                    ),
                    name: this.getFirstString(item.name, item.title, item.productName),
                    quantity: Number(this.getFirstString(item.quantity, item.qty) ?? 1),
                  })),
              }
            : undefined,
        },
      ],
    };
  }

  private async buildPricedOrderSummary(
    message: NonNullable<WhatsAppMessageValue["messages"]>[number],
    fallbackProductName: string
  ): Promise<PricedOrderSummary> {
    const parsedItems = this.parseOrderItems(message);

    if (!parsedItems.length) {
      const product = await ProductModel.findOne({
        isActive: true,
        $or: [{ catalogProductId: fallbackProductName }, { name: fallbackProductName }],
      })
        .collation({ locale: "en", strength: 2 })
        .exec();

      return {
        productName: product?.name ?? fallbackProductName,
        catalogProductId: product?.catalogProductId ?? undefined,
        quantity: 1,
        totalAmount: product?.price ?? env.payment.defaultAmount,
      };
    }

    const catalogProductIds = parsedItems
      .map((item) => item.catalogProductId)
      .filter((catalogProductId): catalogProductId is string => Boolean(catalogProductId));
    const products = catalogProductIds.length
      ? await ProductModel.find({
          catalogProductId: { $in: catalogProductIds },
          isActive: true,
        }).exec()
      : [];
    const productsByCatalogId = new Map(
      products
        .filter((product) => Boolean(product.catalogProductId))
        .map((product) => [product.catalogProductId, product])
    );

    let totalAmount = 0;
    let totalQuantity = 0;
    const names: string[] = [];
    const matchedCatalogProductIds: string[] = [];

    for (const item of parsedItems) {
      const quantity = Math.max(Number(item.quantity) || 1, 1);
      const product = item.catalogProductId ? productsByCatalogId.get(item.catalogProductId) : undefined;
      totalQuantity += quantity;
      totalAmount += (product?.price ?? env.payment.defaultAmount) * quantity;
      names.push(product?.name ?? item.name ?? item.catalogProductId ?? "Catalog Product");

      if (product?.catalogProductId ?? item.catalogProductId) {
        matchedCatalogProductIds.push(String(product?.catalogProductId ?? item.catalogProductId));
      }
    }

    return {
      productName: names.join(", "),
      catalogProductId: matchedCatalogProductIds.join(", ") || undefined,
      quantity: totalQuantity,
      totalAmount,
    };
  }

  private parseOrderItems(message: NonNullable<WhatsAppMessageValue["messages"]>[number]): ParsedOrderItem[] {
    const productItems = message.order?.product_items ?? [];

    return productItems.map((item) => ({
      catalogProductId: item.product_retailer_id,
      name: item.name,
      quantity: item.quantity ?? 1,
    }));
  }

  private getRecord(value: unknown): Record<string, unknown> | undefined {
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  }

  private getArray(...values: unknown[]): unknown[] {
    for (const value of values) {
      if (Array.isArray(value)) {
        return value;
      }
    }

    return [];
  }

  private getFirstString(...values: unknown[]): string | undefined {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }

      if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
      }
    }

    return undefined;
  }

  private buildOrderReference(): string {
    return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}
