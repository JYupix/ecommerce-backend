import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
  jwtVerify: vi.fn(),
  env: {
    JWT_SECRET: "test-jwt-secret",
  },
}));

vi.mock("../config/db.js", () => ({
  prisma: mocks.prisma,
}));

vi.mock("../config/env.js", () => ({
  env: mocks.env,
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: mocks.jwtVerify,
  },
}));

const { authMiddleware } = await import("./auth.middleware.js");

const createMockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const createNext = () => vi.fn() as NextFunction;

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when authorization header is missing", async () => {
    const req = {
      header: vi.fn().mockReturnValue(undefined),
    } as unknown as Request;
    const res = createMockResponse();
    const next = createNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
    expect(mocks.jwtVerify).not.toHaveBeenCalled();
  });

  it("returns 401 when authorization header is malformed", async () => {
    const req = {
      header: vi.fn().mockReturnValue("Token abc123"),
    } as unknown as Request;
    const res = createMockResponse();
    const next = createNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
    expect(mocks.jwtVerify).not.toHaveBeenCalled();
  });

  it("returns 401 when token payload is invalid", async () => {
    const req = {
      header: vi.fn().mockReturnValue("Bearer token-123"),
    } as unknown as Request;
    const res = createMockResponse();
    const next = createNext();

    mocks.jwtVerify.mockReturnValue({ userId: 123, tokenVersion: "1" });

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid token payload" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when user does not exist", async () => {
    const req = {
      header: vi.fn().mockReturnValue("Bearer token-123"),
    } as unknown as Request;
    const res = createMockResponse();
    const next = createNext();

    mocks.jwtVerify.mockReturnValue({ userId: "user-1", tokenVersion: 1 });
    mocks.prisma.user.findUnique.mockResolvedValue(null);

    await authMiddleware(req, res, next);

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: {
        id: true,
        email: true,
        role: true,
        is_active: true,
        tokenVersion: true,
      },
    });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when the user is inactive", async () => {
    const req = {
      header: vi.fn().mockReturnValue("Bearer token-123"),
    } as unknown as Request;
    const res = createMockResponse();
    const next = createNext();

    mocks.jwtVerify.mockReturnValue({ userId: "user-1", tokenVersion: 1 });
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      role: "USER",
      is_active: false,
      tokenVersion: 1,
    });

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token is revoked", async () => {
    const req = {
      header: vi.fn().mockReturnValue("Bearer token-123"),
    } as unknown as Request;
    const res = createMockResponse();
    const next = createNext();

    mocks.jwtVerify.mockReturnValue({ userId: "user-1", tokenVersion: 1 });
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      role: "USER",
      is_active: true,
      tokenVersion: 2,
    });

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Token revoked" });
    expect(next).not.toHaveBeenCalled();
  });

  it("sets req.user and calls next for a valid token", async () => {
    const req = {
      header: vi.fn().mockReturnValue("Bearer token-123"),
    } as unknown as Request;
    const res = createMockResponse();
    const next = createNext();

    mocks.jwtVerify.mockReturnValue({ userId: "user-1", tokenVersion: 1 });
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      role: "ADMIN",
      is_active: true,
      tokenVersion: 1,
    });

    await authMiddleware(req, res, next);

    expect(req.user).toEqual({
      userId: "user-1",
      email: "test@example.com",
      role: "ADMIN",
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});