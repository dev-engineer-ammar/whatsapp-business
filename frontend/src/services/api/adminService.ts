import { axiosInstance } from "./axiosInstance";
import type { Order, OrderStatus, Payment, Product, ProductFormState } from "../../types";

export const adminService = {
  async getOrders(): Promise<Order[]> {
    const response = await axiosInstance.get<{ data: Order[] }>("/admin/orders");
    return response.data.data;
  },

  async getPayments(): Promise<Payment[]> {
    const response = await axiosInstance.get<{ data: Payment[] }>("/admin/payments");
    return response.data.data;
  },

  async getProducts(): Promise<Product[]> {
    const response = await axiosInstance.get<{ data: Product[] }>("/admin/products");
    return response.data.data;
  },

  async updateOrderStatus(orderReference: string, status: OrderStatus): Promise<Order> {
    const response = await axiosInstance.patch<{ data: Order }>(`/admin/orders/${orderReference}/status`, {
      status,
      note: "Order status changed from admin panel.",
    });

    return response.data.data;
  },

  async saveProduct(form: ProductFormState): Promise<Product> {
    const payload = {
      name: form.name,
      catalogProductId: form.catalogProductId || undefined,
      price: Number(form.price),
      stockQuantity: Number(form.stockQuantity),
      description: form.description,
      isActive: form.isActive,
    };
    const endpoint = form.id ? `/admin/products/${form.id}` : "/admin/products";
    const response = form.id
      ? await axiosInstance.patch<{ data: Product }>(endpoint, payload)
      : await axiosInstance.post<{ data: Product }>(endpoint, payload);

    return response.data.data;
  },
};
