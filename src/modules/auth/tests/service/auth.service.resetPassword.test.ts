import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ResetPasswordInput } from "../../auth.types.js";

const mocks = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    emailToken: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
  bcryptHash: vi.fn(),
  sendPasswordChangedEmail: vi.fn(),
  env: {
    NODE_ENV: "development",
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

vi.mock("../../../../utils/email.js", () => ({
  sendVerificationEmail: vi.fn(),
  sendResetPasswordEmail: vi.fn(),
  sendPasswordChangedEmail: mocks.sendPasswordChangedEmail,
  sendPasswordResetConfirmationEmail: vi.fn(),
}));

const { resetPassword } = await import("../../auth.service.js");

const baseInput: ResetPasswordInput = {
  token: "valid-token",
  password: "NewPassword123",
};

const resetMocks = () => {
  vi.clearAllMocks();
  mocks.env.NODE_ENV = "development";
};

describe("resetPassword", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("should reset password with valid token", async () => {
    mocks.prisma.emailToken.findUnique.mockResolvedValue({
      id: "user-1",
      token: "valid-token",
      userId: "user-1",
      type: "RESET_PASSWORD",
      expiresAt: new Date(Date.now() + 3600000),
    });
    mocks.prisma.user.findUnique.mockResolvedValue({
      email: "user-1@example.com",
    });
    mocks.bcryptHash.mockResolvedValue("hashed-new-password");
    mocks.prisma.user.update.mockResolvedValue({});
    mocks.prisma.emailToken.delete.mockResolvedValue({});
    mocks.prisma.$transaction.mockImplementation((ops) => Promise.all(ops));
    mocks.sendPasswordChangedEmail.mockResolvedValue(undefined);

    const result = await resetPassword(baseInput);

    expect(mocks.prisma.emailToken.findUnique).toHaveBeenCalledWith({
      where: { token: "valid-token" },
    });
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { email: true },
    });
    expect(mocks.bcryptHash).toHaveBeenCalledWith("NewPassword123", 10);
    expect(mocks.prisma.$transaction).toHaveBeenCalled();
    expect(mocks.prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        password: "hashed-new-password",
        tokenVersion: { increment: 1 },
      },
    });
    expect(mocks.prisma.emailToken.delete).toHaveBeenCalledWith({
      where: { token: "valid-token" },
    });
    expect(mocks.sendPasswordChangedEmail).toHaveBeenCalledWith(
      "user-1@example.com",
    );
    expect(result).toEqual({ message: "Password reset successfully" });
  });

  it("should return error for invalid token", async () => {
    mocks.prisma.emailToken.findUnique.mockResolvedValue(null);

    await expect(resetPassword(baseInput)).rejects.toThrow(
      "Invalid or expired reset token",
    );

    expect(mocks.prisma.emailToken.findUnique).toHaveBeenCalledWith({
      where: { token: "valid-token" },
    });
    expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled();
    expect(mocks.bcryptHash).not.toHaveBeenCalled();
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
    expect(mocks.prisma.emailToken.delete).not.toHaveBeenCalled();
    expect(mocks.sendPasswordChangedEmail).not.toHaveBeenCalled();
  });

  it("should return error for expired token", async () => {
    mocks.prisma.emailToken.findUnique.mockResolvedValue({
      id: "user-1",
      token: "valid-token",
      userId: "user-1",
      type: "RESET_PASSWORD",
      expiresAt: new Date(Date.now() - 3600000),
    });
    mocks.prisma.emailToken.delete.mockResolvedValue({});

    await expect(resetPassword(baseInput)).rejects.toThrow(
      "Reset token has expired",
    );

    expect(mocks.prisma.emailToken.findUnique).toHaveBeenCalledWith({
      where: { token: "valid-token" },
    });
    expect(mocks.prisma.emailToken.delete).toHaveBeenCalledWith({
      where: { token: "valid-token" },
    });
    expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled();
    expect(mocks.bcryptHash).not.toHaveBeenCalled();
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
    expect(mocks.sendPasswordChangedEmail).not.toHaveBeenCalled();
  });

  it("should return error for invalid type of token", async () => {
    mocks.prisma.emailToken.findUnique.mockResolvedValue({
      id: "user-1",
      token: "valid-token",
      userId: "user-1",
      type: "VERIFY_EMAIL",
      expiresAt: new Date(Date.now() + 3600000),
    });

    await expect(resetPassword(baseInput)).rejects.toThrow(
      "Invalid token type",
    );

    expect(mocks.prisma.emailToken.findUnique).toHaveBeenCalledWith({
      where: { token: "valid-token" },
    });
    expect(mocks.prisma.user.findUnique).not.toHaveBeenCalled();
    expect(mocks.bcryptHash).not.toHaveBeenCalled();
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
    expect(mocks.prisma.emailToken.delete).not.toHaveBeenCalled();
    expect(mocks.sendPasswordChangedEmail).not.toHaveBeenCalled();
  });

  it("should return error for non-existent user", async () => {
    mocks.prisma.emailToken.findUnique.mockResolvedValue({
      id: "user-1",
      token: "valid-token",
      userId: "user-1",
      type: "RESET_PASSWORD",
      expiresAt: new Date(Date.now() + 3600000),
    });
    mocks.prisma.user.findUnique.mockResolvedValue(null);

    await expect(resetPassword(baseInput)).rejects.toThrow(
      "User not found",
    );

    expect(mocks.prisma.emailToken.findUnique).toHaveBeenCalledWith({
      where: { token: "valid-token" },
    });
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { email: true },
    });
    expect(mocks.bcryptHash).not.toHaveBeenCalled();
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
    expect(mocks.prisma.emailToken.delete).not.toHaveBeenCalled();
    expect(mocks.sendPasswordChangedEmail).not.toHaveBeenCalled();
  });

  it("should not fail if sending email fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mocks.prisma.emailToken.findUnique.mockResolvedValue({
      id: "user-1",
      token: "valid-token",
      userId: "user-1",
      type: "RESET_PASSWORD",
      expiresAt: new Date(Date.now() + 3600000),
    });
    mocks.prisma.user.findUnique.mockResolvedValue({
      email: "user-1@example.com",
    });
    mocks.bcryptHash.mockResolvedValue("hashed-new-password");
    mocks.prisma.user.update.mockResolvedValue({});
    mocks.prisma.emailToken.delete.mockResolvedValue({});
    mocks.prisma.$transaction.mockImplementation((ops) => Promise.all(ops));
    mocks.sendPasswordChangedEmail.mockRejectedValue(new Error("Email service down"));

    const result = await resetPassword(baseInput);

    expect(mocks.prisma.$transaction).toHaveBeenCalled();
    expect(mocks.prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        password: "hashed-new-password",
        tokenVersion: { increment: 1 },
      },
    });
    expect(mocks.sendPasswordChangedEmail).toHaveBeenCalledWith(
      "user-1@example.com",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to send password changed email",
    );
    expect(result).toEqual({ message: "Password reset successfully" });
  });
});
