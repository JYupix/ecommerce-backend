import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import type { Request, Response, NextFunction } from "express";

import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use((error: SyntaxError & { status?: number }, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      error: "Invalid JSON body",
    });
  }

  next(error);
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "ecommerce_api" });
});

app.use("/auth", authRoutes);

export default app;