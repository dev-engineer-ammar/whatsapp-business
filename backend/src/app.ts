import express from "express";
import path from "node:path";
import { ApplicationContainer } from "./container.js";
import { createRouter } from "./routes/index.js";

export const createApp = () => {
  const app = express();
  const container = new ApplicationContainer();

  app.use(express.json());
  app.use("/api", createRouter(container));
  app.use("/admin", express.static(path.join(process.cwd(), "..", "frontend", "dist")));

  return app;
};
