import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    emailToken: {
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
  bcryptHash: vi.fn(),
  generateToken: vi.fn(),
  sendVerificationEmail: vi.fn(),
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
    hash: mocks.bcryptHash,
  },
}));

vi.mock("../../../../utils/token.js", () => ({
  generateToken: mocks.generateToken,
}));

vi.mock("../../../../utils/email.js", () => ({
  sendVerificationEmail: mocks.sendVerificationEmail,
  sendResetPasswordEmail: vi.fn(),
  sendPasswordChangedEmail: vi.fn(),
  sendPasswordResetConfirmationEmail: vi.fn(),
}));

const { verifyEmail } = await import("../../auth.service.js");

const resetMocks = () => {
  vi.clearAllMocks();
  mocks.env.NODE_ENV = "development";
};

describe("verifyEmail", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("verifies the email with a valid token", async () => {
    mocks.prisma.emailToken.findUnique.mockResolvedValue({
      token: "valid-token",
      userId: "user-1",
      type: "VERIFY_EMAIL",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email_verified: false,
    });
    mocks.prisma.user.update.mockResolvedValue({});
    mocks.prisma.emailToken.delete.mockResolvedValue({});

    const result = await verifyEmail("valid-token");

    expect(mocks.prisma.emailToken.findUnique).toHaveBeenCalledWith({
      where: { token: "valid-token" },
    });
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
    });
    expect(mocks.prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        email_verified: true,
        email_verified_at: expect.any(Date),
      },
    });
    expect(mocks.prisma.emailToken.delete).toHaveBeenCalledWith({
      where: { token: "valid-token" },
    });
    expect(result).toEqual({ message: "Email verified successfully" });
  });

  it("throws when the token is invalid or doesn't exist", async () => {
    mocks.prisma.emailToken.findUnique.mockResolvedValue(null);

    await expect(verifyEmail("invalid-token")).rejects.toThrow(
      "Invalid or expired verification token",
    );

    expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled();
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
    expect(mocks.prisma.emailToken.delete).not.toHaveBeenCalled();
  });

  it("throws when the token is expired", async () => {
    mocks.prisma.emailToken.findUnique.mockResolvedValue({
      token: "expired-token",
      userId: "user-1",
      type: "VERIFY_EMAIL",
      expiresAt: new Date(Date.now() - 60 * 60 * 1000),
    });
    mocks.prisma.emailToken.delete.mockResolvedValue({});

    await expect(verifyEmail("expired-token")).rejects.toThrow(
      "Verification token has expired",
    );

    expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled();
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
    expect(mocks.prisma.emailToken.delete).toHaveBeenCalledWith({
      where: { token: "expired-token" },
    });
    expect(mocks.prisma.emailToken.delete).toHaveBeenCalledTimes(1);
  });

  it("throws when the token type is invalid", async () => {
    mocks.prisma.emailToken.findUnique.mockResolvedValue({
      token: "invalid-type-token",
      userId: "user-1",
      type: "RESET_PASSWORD",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await expect(verifyEmail("invalid-type-token")).rejects.toThrow(
      "Invalid token type",
    );

    expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled();
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
    expect(mocks.prisma.emailToken.delete).not.toHaveBeenCalled();
  });

  it("throws when the user is not found", async () => {
    mocks.prisma.emailToken.findUnique.mockResolvedValue({
      token: "valid-token",
      userId: "user-1",
      type: "VERIFY_EMAIL",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    mocks.prisma.user.findUnique.mockResolvedValue(null);

    await expect(verifyEmail("valid-token")).rejects.toThrow("User not found");

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
    });
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
    expect(mocks.prisma.emailToken.delete).not.toHaveBeenCalled();
  });

  it("returns a message if the email is already verified", async () => {
    mocks.prisma.emailToken.findUnique.mockResolvedValue({
      token: "valid-token",
      userId: "user-1",
      type: "VERIFY_EMAIL",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email_verified: true,
    });
    mocks.prisma.emailToken.delete.mockResolvedValue({});

    const result = await verifyEmail("valid-token");

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
    });
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
    expect(mocks.prisma.emailToken.delete).toHaveBeenCalledWith({
      where: { token: "valid-token" },
    });
    expect(mocks.prisma.emailToken.delete).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ message: "Email already verified" });
  });
});
