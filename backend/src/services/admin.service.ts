import { OrderModel, type OrderDocument } from "../models/order.model.js";
import { PaymentModel, type PaymentDocument } from "../models/payment.model.js";
import type { OrderStatus, PaymentStatus } from "../types/order.js";

interface OrderListFilters {
  status?: string;
  paymentStatus?: string;
  search?: string;
}

export class AdminService {
  async listOrders(filters: OrderListFilters): Promise<OrderDocument[]> {
    const query: Record<string, unknown> = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.paymentStatus) {
      query.paymentStatus = filters.paymentStatus;
    }

    if (filters.search) {
      query.$or = [
        { orderReference: new RegExp(filters.search, "i") },
        { customerName: new RegExp(filters.search, "i") },
        { whatsappNumber: new RegExp(filters.search, "i") },
      ];
    }

    return OrderModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async getOrder(orderReference: string): Promise<OrderDocument | null> {
    return OrderModel.findOne({ orderReference }).exec();
  }

  async updateOrderStatus(
    orderReference: string,
    status: OrderStatus,
    note = "Order updated from admin panel."
  ): Promise<OrderDocument | null> {
    return OrderModel.findOneAndUpdate(
      { orderReference },
      {
        status,
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

  async listPayments(status?: PaymentStatus): Promise<PaymentDocument[]> {
    return PaymentModel.find(status ? { status } : {}).sort({ createdAt: -1 }).exec();
  }
}
