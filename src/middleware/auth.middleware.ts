import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";

interface AuthUser {
  userId: string;
  email: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

interface TokenPayload extends JwtPayload {
  userId: string;
  tokenVersion: number;
}

const isTokenPayload = (value: unknown): value is TokenPayload => {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    typeof (value as TokenPayload).userId === "string" &&
    typeof (value as TokenPayload).tokenVersion === "number"
  );
};

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (!isTokenPayload(decoded)) {
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        is_active: true,
        tokenVersion: true,
      },
    });

    if (!user || !user.is_active) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      res.status(401).json({ error: "Token revoked" });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
    };

    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};