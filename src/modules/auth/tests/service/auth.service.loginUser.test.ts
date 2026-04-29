import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LoginInput } from "../../auth.types.js";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
  bcryptCompare: vi.fn(),
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
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

vi.mock("bcrypt", () => ({
  default: {
    compare: mocks.bcryptCompare,
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
  generateRefreshToken: mocks.generateRefreshToken,
}));

const { loginUser } = await import("../../auth.service.js");

const baseInput: LoginInput = {
  email: "test@example.com",
  password: "Password123",
};

const resetMocks = () => {
  vi.clearAllMocks();
  mocks.env.NODE_ENV = "development";
};

describe("loginUser", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("returns tokens for a valid active and verified user", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email_verified: true,
      is_active: true,
      password: "hashed-password",
      tokenVersion: 3,
    });
    mocks.bcryptCompare.mockResolvedValue(true);
    mocks.generateAccessToken.mockReturnValue("access-token");
    mocks.generateRefreshToken.mockReturnValue("refresh-token");

    const result = await loginUser(baseInput);

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    expect(mocks.bcryptCompare).toHaveBeenCalledWith(
      "Password123",
      "hashed-password",
    );
    expect(mocks.generateAccessToken).toHaveBeenCalledWith("user-1", 3);
    expect(mocks.generateRefreshToken).toHaveBeenCalledWith("user-1", 3);
    expect(result).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
  });

  it("throws an error if the user is not found", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);

    await expect(loginUser(baseInput)).rejects.toThrow("Invalid credentials");

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    expect(mocks.bcryptCompare).not.toHaveBeenCalled();
    expect(mocks.generateAccessToken).not.toHaveBeenCalled();
    expect(mocks.generateRefreshToken).not.toHaveBeenCalled();
  });

  it("throws an error if the email is not verified", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email_verified: false,
      is_active: true,
      password: "hashed-password",
      tokenVersion: 3,
    });

    await expect(loginUser(baseInput)).rejects.toThrow("Please verify your email");

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    expect(mocks.bcryptCompare).not.toHaveBeenCalled();
    expect(mocks.generateAccessToken).not.toHaveBeenCalled();
    expect(mocks.generateRefreshToken).not.toHaveBeenCalled();
  });

  it("throws an error if the account is inactive", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email_verified: true,
      is_active: false,
      password: "hashed-password",
      tokenVersion: 3,
    });

    await expect(loginUser(baseInput)).rejects.toThrow("Account disabled");

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    expect(mocks.bcryptCompare).not.toHaveBeenCalled();
    expect(mocks.generateAccessToken).not.toHaveBeenCalled();
    expect(mocks.generateRefreshToken).not.toHaveBeenCalled();
  });

  it("throws an error if the password is incorrect", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email_verified: true,
      is_active: true,
      password: "hashed-password",
      tokenVersion: 3,
    });
    mocks.bcryptCompare.mockResolvedValue(false);

    await expect(loginUser(baseInput)).rejects.toThrow("Invalid credentials");

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    expect(mocks.bcryptCompare).toHaveBeenCalledWith(
      "Password123",
      "hashed-password",
    );
    expect(mocks.generateAccessToken).not.toHaveBeenCalled();
    expect(mocks.generateRefreshToken).not.toHaveBeenCalled();
  });
});