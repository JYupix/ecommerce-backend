import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

import { requireRole } from "./role.middleware.js";

const createMockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const createNext = () => vi.fn() as NextFunction;

describe("requireRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the request has no user", () => {
    const middleware = requireRole("ADMIN");
    const req = {} as Request;
    const res = createMockResponse();
    const next = createNext();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when the role is not allowed", () => {
    const middleware = requireRole("ADMIN");
    const req = {
      user: {
        userId: "user-1",
        email: "test@example.com",
        role: "USER",
      },
    } as unknown as Request;
    const res = createMockResponse();
    const next = createNext();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when the role is allowed", () => {
    const middleware = requireRole("ADMIN");
    const req = {
      user: {
        userId: "admin-1",
        email: "admin@example.com",
        role: "ADMIN",
      },
    } as unknown as Request;
    const res = createMockResponse();
    const next = createNext();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});