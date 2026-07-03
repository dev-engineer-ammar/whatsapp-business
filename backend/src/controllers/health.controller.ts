import type { Request, Response } from "express";

export class HealthController {
  getHealth(_req: Request, res: Response): void {
    res.status(200).json({
      success: true,
      message: "WhatsApp commerce API is running.",
    });
  }
}
