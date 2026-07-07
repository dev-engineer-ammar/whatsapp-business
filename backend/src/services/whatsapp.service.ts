import axios, { type AxiosInstance } from "axios";
import { env } from "../config/env.js";

export class WhatsAppService {
  private readonly httpClient: AxiosInstance;

  constructor(httpClient?: AxiosInstance) {
    this.httpClient =
      httpClient ??
      axios.create({
        baseURL:
          env.whatsapp.provider === "wati"
            ? env.whatsapp.watiBaseUrl
            : `https://graph.facebook.com/${env.whatsapp.apiVersion}`,
        headers: {
          Authorization: `Bearer ${env.whatsapp.token}`,
          "Content-Type": "application/json",
        },
      });
  }

  async sendTextMessage(to: string, body: string): Promise<void> {
    if (env.whatsapp.provider === "wati") {
      await this.httpClient.post(`/api/v1/sendSessionMessage/${to}`, undefined, {
        params: {
          messageText: body,
        },
      });
      return;
    }

    if (!env.whatsapp.phoneNumberId) {
      throw new Error("Missing WhatsApp phone number ID.");
    }

    await this.httpClient.post(`/${env.whatsapp.phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body,
      },
    });
  }
}
