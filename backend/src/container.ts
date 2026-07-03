import { AdminAuthController } from "./controllers/admin-auth.controller.js";
import { AdminController } from "./controllers/admin.controller.js";
import { HealthController } from "./controllers/health.controller.js";
import { OrderController } from "./controllers/order.controller.js";
import { WebhookController } from "./controllers/webhook.controller.js";
import { AdminAuthService } from "./services/admin-auth.service.js";
import { AdminService } from "./services/admin.service.js";
import { OrderService } from "./services/order.service.js";
import { PaymentGatewayService } from "./services/payment.service.js";
import { ProductService } from "./services/product.service.js";
import { WhatsAppService } from "./services/whatsapp.service.js";

export class ApplicationContainer {
  readonly adminAuthService = new AdminAuthService();
  private readonly adminService = new AdminService();
  private readonly paymentGatewayService = new PaymentGatewayService();
  private readonly productService = new ProductService();
  private readonly whatsAppService = new WhatsAppService();
  private readonly orderService = new OrderService(
    this.paymentGatewayService,
    this.whatsAppService
  );

  readonly adminAuthController = new AdminAuthController(this.adminAuthService);
  readonly adminController = new AdminController(this.adminService, this.productService);
  readonly healthController = new HealthController();
  readonly orderController = new OrderController(this.orderService);
  readonly webhookController = new WebhookController(this.orderService);
}
