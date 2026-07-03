import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { OrderService } from "../services/order.service.js";

export class WebhookController {
  constructor(private readonly orderService: OrderService) {}

  verifyWhatsAppWebhook = (req: Request, res: Response): void => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === env.whatsapp.verifyToken) {
      res.status(200).send(String(challenge ?? ""));
      return;
    }

    res.status(403).json({
      success: false,
      error: "Webhook verification failed.",
    });
  };

  handleWhatsAppWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.orderService.handleWhatsAppWebhook(req.body);

      res.status(200).json({
        success: true,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unable to process WhatsApp webhook.",
      });
    }
  };

  handlePaymentWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const order = await this.orderService.handlePaymentWebhook(req.body);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Unable to process payment webhook.",
      });
    }
  };
}
