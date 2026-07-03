import type { Request, Response } from "express";
import { OrderService } from "../services/order.service.js";

export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const order = await this.orderService.createFromManualInput(req.body);

      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Unable to create order.",
      });
    }
  };
}
