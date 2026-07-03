import type { Request, Response } from "express";
import { AdminAuthService } from "../services/admin-auth.service.js";

export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  login = (req: Request, res: Response): void => {
    const username = String(req.body.username ?? "");
    const password = String(req.body.password ?? "");

    if (!this.adminAuthService.validateCredentials(username, password)) {
      res.status(401).json({
        success: false,
        error: "Invalid admin credentials.",
      });
      return;
    }

    const token = this.adminAuthService.createSessionToken(username);

    res.setHeader("Set-Cookie", this.adminAuthService.createCookie(token));
    res.status(200).json({
      success: true,
      data: {
        username,
      },
    });
  };

  logout = (_req: Request, res: Response): void => {
    res.setHeader("Set-Cookie", this.adminAuthService.clearCookie());
    res.status(200).json({
      success: true,
    });
  };

  me = (_req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
    });
  };
}
