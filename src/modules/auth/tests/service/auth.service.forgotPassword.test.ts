import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    emailToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  },
  generateToken: vi.fn(),
  sendResetPasswordEmail: vi.fn(),
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

vi.mock("../../../../utils/token.js", () => ({
  generateToken: mocks.generateToken,
}));

vi.mock("../../../../utils/email.js", () => ({
  sendVerificationEmail: vi.fn(),
  sendResetPasswordEmail: mocks.sendResetPasswordEmail,
  sendPasswordChangedEmail: vi.fn(),
  sendPasswordResetConfirmationEmail: vi.fn(),
}));

const { forgotPassword } = await import("../../auth.service.js");

const resetMocks = () => {
  vi.clearAllMocks();
  mocks.env.NODE_ENV = "development";
};

describe("forgotPassword", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("should send reset password email if user exists", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
    });
    mocks.generateToken.mockReturnValue("reset-token");

    const result = await forgotPassword({ email: "test@example.com" });

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    expect(mocks.prisma.emailToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", type: "RESET_PASSWORD" },
    });
    expect(mocks.generateToken).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.emailToken.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "RESET_PASSWORD",
        token: "reset-token",
        expiresAt: expect.any(Date),
      },
    });
    expect(mocks.sendResetPasswordEmail).toHaveBeenCalledWith(
      "test@example.com",
      "reset-token",
    );
    expect(result).toEqual({
      message: "If the email exists, a reset link has been sent",
    });
  });

  it("should not send email if user does not exist", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);

    await expect(forgotPassword({ email: "test@example.com" })).resolves.toEqual({
      message: "If the email exists, a reset link has been sent",
    });

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    expect(mocks.prisma.emailToken.deleteMany).not.toHaveBeenCalled();
    expect(mocks.generateToken).not.toHaveBeenCalled();
    expect(mocks.prisma.emailToken.create).not.toHaveBeenCalled();
    expect(mocks.sendResetPasswordEmail).not.toHaveBeenCalled();
  });

  it("should send the reset link and cleanup if email sending fails", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
    });
    mocks.generateToken.mockReturnValue("reset-token");
    mocks.sendResetPasswordEmail.mockRejectedValue(new Error("SMTP error"));

    await expect(forgotPassword({ email: "test@example.com" })).rejects.toThrow(
      "Error sending reset email",
    );

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    expect(mocks.prisma.emailToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", type: "RESET_PASSWORD" },
    });
    expect(mocks.generateToken).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.emailToken.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "RESET_PASSWORD",
        token: "reset-token",
        expiresAt: expect.any(Date),
      },
    });
    expect(mocks.sendResetPasswordEmail).toHaveBeenCalledWith(
      "test@example.com",
      "reset-token",
    );
    expect(mocks.prisma.emailToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", type: "RESET_PASSWORD" },
    });
    expect(mocks.prisma.emailToken.deleteMany).toHaveBeenCalledTimes(2);
  });
});
