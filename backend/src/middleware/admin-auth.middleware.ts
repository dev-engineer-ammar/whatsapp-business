import type { NextFunction, Request, Response } from "express";
import { AdminAuthService } from "../services/admin-auth.service.js";

export const requireAdminAuth =
  (adminAuthService: AdminAuthService) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const sessionToken = adminAuthService.extractCookie(req.header("cookie"));
    const apiKey = req.header("x-admin-api-key");

    if (adminAuthService.verifySessionToken(sessionToken) || adminAuthService.validateApiKey(apiKey)) {
      next();
      return;
    }

    res.status(401).json({
      success: false,
      error: "Admin authentication required.",
    });
  };
