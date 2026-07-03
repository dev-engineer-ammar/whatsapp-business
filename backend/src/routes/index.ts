import { Router } from "express";
import { AdminAuthController } from "../controllers/admin-auth.controller.js";
import { AdminController } from "../controllers/admin.controller.js";
import { HealthController } from "../controllers/health.controller.js";
import { OrderController } from "../controllers/order.controller.js";
import { WebhookController } from "../controllers/webhook.controller.js";
import { requireAdminAuth } from "../middleware/admin-auth.middleware.js";
import { AdminAuthService } from "../services/admin-auth.service.js";

interface RouteDependencies {
  adminAuthController: AdminAuthController;
  adminAuthService: AdminAuthService;
  adminController: AdminController;
  healthController: HealthController;
  orderController: OrderController;
  webhookController: WebhookController;
}

export const createRouter = (dependencies: RouteDependencies): Router => {
  const router = Router();
  const adminOnly = requireAdminAuth(dependencies.adminAuthService);

  router.get("/health", dependencies.healthController.getHealth);
  router.post("/orders", dependencies.orderController.createOrder);

  router.get("/webhooks/whatsapp", dependencies.webhookController.verifyWhatsAppWebhook);
  router.post("/webhooks/whatsapp", dependencies.webhookController.handleWhatsAppWebhook);
  router.post("/webhooks/payment", dependencies.webhookController.handlePaymentWebhook);

  router.post("/admin/auth/login", dependencies.adminAuthController.login);
  router.post("/admin/auth/logout", dependencies.adminAuthController.logout);
  router.get("/admin/auth/me", adminOnly, dependencies.adminAuthController.me);

  router.get("/admin/orders", adminOnly, dependencies.adminController.listOrders);
  router.get("/admin/orders/:orderReference", adminOnly, dependencies.adminController.getOrder);
  router.patch(
    "/admin/orders/:orderReference/status",
    adminOnly,
    dependencies.adminController.updateOrderStatus
  );
  router.get("/admin/payments", adminOnly, dependencies.adminController.listPayments);
  router.get("/admin/products", adminOnly, dependencies.adminController.listProducts);
  router.post("/admin/products", adminOnly, dependencies.adminController.createProduct);
  router.patch("/admin/products/:productId", adminOnly, dependencies.adminController.updateProduct);

  return router;
};
