import type { Request, Response } from "express";
import type { OrderStatus, PaymentStatus } from "../types/order.js";
import { AdminService } from "../services/admin.service.js";
import { DuplicateProductCatalogIdError, ProductService } from "../services/product.service.js";

export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly productService: ProductService
  ) {}

  listOrders = async (req: Request, res: Response): Promise<void> => {
    const orders = await this.adminService.listOrders({
      status: this.getQueryString(req.query.status),
      paymentStatus: this.getQueryString(req.query.paymentStatus),
      search: this.getQueryString(req.query.search),
    });

    res.status(200).json({ success: true, data: orders });
  };

  getOrder = async (req: Request, res: Response): Promise<void> => {
    const orderReference = this.getRouteParam(req.params.orderReference);
    const order = await this.adminService.getOrder(orderReference);

    if (!order) {
      res.status(404).json({ success: false, error: "Order not found." });
      return;
    }

    res.status(200).json({ success: true, data: order });
  };

  updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    const orderReference = this.getRouteParam(req.params.orderReference);
    const order = await this.adminService.updateOrderStatus(
      orderReference,
      req.body.status as OrderStatus,
      req.body.note
    );

    if (!order) {
      res.status(404).json({ success: false, error: "Order not found." });
      return;
    }

    res.status(200).json({ success: true, data: order });
  };

  listPayments = async (req: Request, res: Response): Promise<void> => {
    const payments = await this.adminService.listPayments(
      this.getQueryString(req.query.status) as PaymentStatus | undefined
    );

    res.status(200).json({ success: true, data: payments });
  };

  listProducts = async (_req: Request, res: Response): Promise<void> => {
    const products = await this.productService.listProducts();

    res.status(200).json({ success: true, data: products });
  };

  createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const product = await this.productService.createProduct(req.body);

      res.status(201).json({ success: true, data: product });
    } catch (error) {
      this.handleProductError(error, res);
    }
  };

  updateProduct = async (req: Request, res: Response): Promise<void> => {
    const productId = this.getRouteParam(req.params.productId);
    try {
      const product = await this.productService.updateProduct(productId, req.body);

      if (!product) {
        res.status(404).json({ success: false, error: "Product not found." });
        return;
      }

      res.status(200).json({ success: true, data: product });
    } catch (error) {
      this.handleProductError(error, res);
    }
  };

  private getQueryString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  }

  private getRouteParam(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] : value ?? "";
  }

  private handleProductError(error: unknown, res: Response): void {
    if (error instanceof DuplicateProductCatalogIdError) {
      res.status(409).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Unable to save product.",
    });
  }
}
