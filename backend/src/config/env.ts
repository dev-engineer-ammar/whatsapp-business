import dotenv from "dotenv";

dotenv.config();

const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

export const env = {
  app: {
    port: Number(process.env.PORT ?? 5000),
    adminApiKey: process.env.ADMIN_API_KEY,
    adminUsername: process.env.ADMIN_USERNAME ?? "admin",
    adminPassword: process.env.ADMIN_PASSWORD,
    adminSessionSecret:
      process.env.ADMIN_SESSION_SECRET ??
      process.env.ADMIN_API_KEY ??
      process.env.EASYPAISA_HASH_KEY ??
      "change-this-admin-session-secret",
  },
  database: {
    uri: getEnv("MONGODB_URI", "mongodb://127.0.0.1:27017/whatsapp-commerce"),
  },
  whatsapp: {
    apiVersion: process.env.WHATSAPP_API_VERSION ?? "v25.0",
    token: getEnv("WHATSAPP_TOKEN"),
    phoneNumberId: getEnv("WHATSAPP_PHONE_NUMBER_ID", process.env.PHONE_NUMBER_ID),
    verifyToken: getEnv("WHATSAPP_VERIFY_TOKEN", "my_super_secret_verify_token_2026"),
  },
  payment: {
    baseUrl: getEnv("EASYPAISA_PAYMENT_BASE_URL", "https://easypaisa.example.com/pay"),
    storeId: getEnv("EASYPAISA_STORE_ID", "demo-store"),
    hashKey: getEnv("EASYPAISA_HASH_KEY", "demo-hash-key"),
    callbackUrl: getEnv("EASYPAISA_CALLBACK_URL", "http://localhost:5000/api/webhooks/payment"),
    defaultAmount: Number(process.env.DEFAULT_ORDER_AMOUNT ?? 1000),
    defaultCurrency: process.env.DEFAULT_CURRENCY ?? "PKR",
  },
};
