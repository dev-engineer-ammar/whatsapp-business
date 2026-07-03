import crypto from "node:crypto";
import { env } from "../config/env.js";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export class AdminAuthService {
  readonly cookieName = "admin_session";

  validateCredentials(username: string, password: string): boolean {
    if (!env.app.adminPassword) {
      return false;
    }

    return (
      this.safeEqual(username, env.app.adminUsername) &&
      this.safeEqual(password, env.app.adminPassword)
    );
  }

  createSessionToken(username: string): string {
    const payload = {
      username,
      expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = this.sign(encodedPayload);

    return `${encodedPayload}.${signature}`;
  }

  verifySessionToken(token: string | undefined): boolean {
    if (!token) {
      return false;
    }

    const [encodedPayload, signature] = token.split(".");

    if (!encodedPayload || !signature || !this.safeEqual(signature, this.sign(encodedPayload))) {
      return false;
    }

    try {
      const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as {
        username?: string;
        expiresAt?: number;
      };

      return payload.username === env.app.adminUsername && Number(payload.expiresAt) > Date.now();
    } catch {
      return false;
    }
  }

  createCookie(token: string): string {
    return [
      `${this.cookieName}=${token}`,
      "HttpOnly",
      "SameSite=Lax",
      "Path=/",
      `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
      ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
    ].join("; ");
  }

  clearCookie(): string {
    return `${this.cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
  }

  extractCookie(cookieHeader: string | undefined): string | undefined {
    return cookieHeader
      ?.split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${this.cookieName}=`))
      ?.slice(this.cookieName.length + 1);
  }

  validateApiKey(apiKey: string | undefined): boolean {
    return Boolean(env.app.adminApiKey && apiKey && this.safeEqual(apiKey, env.app.adminApiKey));
  }

  private sign(value: string): string {
    return crypto.createHmac("sha256", env.app.adminSessionSecret).update(value).digest("base64url");
  }

  private safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
  }
}
