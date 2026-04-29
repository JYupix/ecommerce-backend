import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
  jwtVerify: vi.fn(),
  generateAccessToken: vi.fn(),
  env: {
    NODE_ENV: "development",
    JWT_REFRESH_SECRET: "test-refresh-secret",
  },
}));

vi.mock("../../../../config/db.js", () => ({
  prisma: mocks.prisma,
}));

vi.mock("../../../../config/env.js", () => ({
  env: mocks.env,
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: mocks.jwtVerify,
  },
}));

vi.mock("../../../../utils/email.js", () => ({
  sendVerificationEmail: vi.fn(),
  sendResetPasswordEmail: vi.fn(),
  sendPasswordChangedEmail: vi.fn(),
  sendPasswordResetConfirmationEmail: vi.fn(),
}));

vi.mock("../../../../utils/jwt.js", () => ({
  generateAccessToken: mocks.generateAccessToken,
}));

const { refreshToken } = await import("../../auth.service.js");

const resetMocks = () => {
  vi.clearAllMocks();
  mocks.env.NODE_ENV = "development";
};

describe("refreshToken", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("should refresh access token with valid refresh token", async () => {
    mocks.jwtVerify.mockReturnValue({ userId: "user-1", tokenVersion: 0 });
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      is_active: true,
      tokenVersion: 0,
    });
    mocks.generateAccessToken.mockReturnValue("new-access-token");

    const result = await refreshToken("valid-refresh-token");

    expect(mocks.jwtVerify).toHaveBeenCalledWith(
      "valid-refresh-token",
      "test-refresh-secret",
    );
    expect(mocks.jwtVerify).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "user-1" } });
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledTimes(1);
    expect(mocks.generateAccessToken).toHaveBeenCalledWith("user-1", 0);
    expect(mocks.generateAccessToken).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ accessToken: "new-access-token" });
  });

  it("should throw error for invalid or expired refresh token", async () => {
    mocks.jwtVerify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    await expect(refreshToken("invalid-refresh-token")).rejects.toThrow(
      "Invalid or expired refresh token",
    );

    expect(mocks.jwtVerify).toHaveBeenCalledWith(
      "invalid-refresh-token",
      "test-refresh-secret",
    );
    expect(mocks.jwtVerify).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled();
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledTimes(0);
    expect(mocks.generateAccessToken).not.toHaveBeenCalled();
    expect(mocks.generateAccessToken).toHaveBeenCalledTimes(0);
  });

  it("should throw error for non-existent user", async () => {
    mocks.jwtVerify.mockReturnValue({ userId: "user-1", tokenVersion: 0 });
    mocks.prisma.user.findUnique.mockResolvedValue(null);

    await expect(refreshToken("valid-refresh-token")).rejects.toThrow("Unauthorized");

    expect(mocks.jwtVerify).toHaveBeenCalledWith("valid-refresh-token", "test-refresh-secret");
    expect(mocks.jwtVerify).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "user-1" } });
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledTimes(1);
    expect(mocks.generateAccessToken).not.toHaveBeenCalled();
    expect(mocks.generateAccessToken).toHaveBeenCalledTimes(0);
  });

  it("should throw error for inactive user", async () => {
    mocks.jwtVerify.mockReturnValue({ userId: "user-1", tokenVersion: 0 });
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      is_active: false,
      tokenVersion: 0,
    });

    await expect(refreshToken("valid-refresh-token")).rejects.toThrow("Unauthorized");

    expect(mocks.jwtVerify).toHaveBeenCalledWith("valid-refresh-token", "test-refresh-secret");
    expect(mocks.jwtVerify).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "user-1" } });
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledTimes(1);
    expect(mocks.generateAccessToken).not.toHaveBeenCalled();
    expect(mocks.generateAccessToken).toHaveBeenCalledTimes(0);
  });

  it("should throw error for revoked refresh token", async () => {
    mocks.jwtVerify.mockReturnValue({ userId: "user-1", tokenVersion: 0 });
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      is_active: true,
      tokenVersion: 1,
    });

    await expect(refreshToken("valid-refresh-token")).rejects.toThrow("Refresh token revoked");

    expect(mocks.jwtVerify).toHaveBeenCalledWith("valid-refresh-token", "test-refresh-secret");
    expect(mocks.jwtVerify).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "user-1" } });
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledTimes(1);
    expect(mocks.generateAccessToken).not.toHaveBeenCalled();
    expect(mocks.generateAccessToken).toHaveBeenCalledTimes(0);
  });
});
