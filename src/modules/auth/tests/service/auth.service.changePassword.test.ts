import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChangePasswordInput } from "../../auth.types.js";

const mocks = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    emailToken: {
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
  bcryptHash: vi.fn(),
  bcryptCompare: vi.fn(),
  sendPasswordResetConfirmationEmail: vi.fn(),
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

vi.mock("../../../../utils/email.js", () => ({
  sendVerificationEmail: vi.fn(),
  sendResetPasswordEmail: vi.fn(),
  sendPasswordChangedEmail: vi.fn(),
  sendPasswordResetConfirmationEmail: mocks.sendPasswordResetConfirmationEmail,
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: mocks.bcryptHash,
    compare: mocks.bcryptCompare,
  },
}));

const { changePassword } = await import("../../auth.service.js");

const baseInput: ChangePasswordInput = {
  currentPassword: "OldPassword123",
  newPassword: "NewPassword123",
  confirmPassword: "NewPassword123",
};

const resetMocks = () => {
  vi.clearAllMocks();
  mocks.env.NODE_ENV = "development";
};

describe("changePassword", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("should change password when current password is correct", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      password: "old-hash",
      tokenVersion: 3,
    });
    mocks.bcryptCompare.mockResolvedValueOnce(true);
    mocks.bcryptCompare.mockResolvedValueOnce(false);
    mocks.bcryptHash.mockResolvedValue("new-hash");
    mocks.prisma.user.update.mockResolvedValue({});
    mocks.prisma.emailToken.deleteMany.mockResolvedValue({});
    mocks.prisma.$transaction.mockImplementation((ops) => Promise.all(ops));
    mocks.sendPasswordResetConfirmationEmail.mockResolvedValue(undefined);

    const result = await changePassword("user-1", baseInput);
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
    });
    expect(mocks.bcryptCompare).toHaveBeenNthCalledWith(
      1,
      "OldPassword123",
      "old-hash",
    );
    expect(mocks.bcryptCompare).toHaveBeenNthCalledWith(
      2,
      "NewPassword123",
      "old-hash",
    );
    expect(mocks.bcryptHash).toHaveBeenCalledWith("NewPassword123", 10);
    expect(mocks.prisma.$transaction).toHaveBeenCalled();
    expect(mocks.prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { password: "new-hash", tokenVersion: { increment: 1 } },
    });
    expect(mocks.prisma.emailToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", type: "RESET_PASSWORD" },
    });
    expect(mocks.sendPasswordResetConfirmationEmail).toHaveBeenCalledWith(
      "test@example.com",
    );
    expect(result).toEqual({ message: "Password changed successfully" });
  });

  it("should throw 'User not found' when user does not exist", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);

    await expect(changePassword("user-1", baseInput)).rejects.toThrow(
      "User not found",
    );

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
    });
    expect(mocks.bcryptCompare).not.toHaveBeenCalled();
    expect(mocks.bcryptHash).not.toHaveBeenCalled();
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
    expect(mocks.prisma.emailToken.deleteMany).not.toHaveBeenCalled();
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
    expect(mocks.sendPasswordResetConfirmationEmail).not.toHaveBeenCalled();
  });

  it("should throw 'Current password is incorrect' when current password is wrong", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      password: "old-hash",
      tokenVersion: 3,
    });
    mocks.bcryptCompare.mockResolvedValue(false);

    await expect(changePassword("user-1", baseInput)).rejects.toThrow(
      "Current password is incorrect",
    );
    
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
    });
    expect(mocks.bcryptCompare).toHaveBeenCalledWith("OldPassword123", "old-hash");
    expect(mocks.bcryptHash).not.toHaveBeenCalled();
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
    expect(mocks.prisma.emailToken.deleteMany).not.toHaveBeenCalled();
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
    expect(mocks.sendPasswordResetConfirmationEmail).not.toHaveBeenCalled();
  });

  it("should throw 'New password must be different' when new password equals current", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      password: "old-hash",
      tokenVersion: 3,
    });
    mocks.bcryptCompare.mockResolvedValueOnce(true);
    mocks.bcryptCompare.mockResolvedValueOnce(true);

    await expect(changePassword("user-1", baseInput)).rejects.toThrow(
      "New password must be different",
    );

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
    });
    expect(mocks.bcryptCompare).toHaveBeenNthCalledWith(
      1,
      "OldPassword123",
      "old-hash",
    );
    expect(mocks.bcryptCompare).toHaveBeenNthCalledWith(
      2,
      "NewPassword123",
      "old-hash",
    );
    expect(mocks.bcryptHash).not.toHaveBeenCalled();
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
    expect(mocks.prisma.emailToken.deleteMany).not.toHaveBeenCalled();
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
    expect(mocks.sendPasswordResetConfirmationEmail).not.toHaveBeenCalled();
  });

  it("should not fail if sending confirmation email fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      password: "old-hash",
      tokenVersion: 3,
    });
    mocks.bcryptCompare.mockResolvedValueOnce(true);
    mocks.bcryptCompare.mockResolvedValueOnce(false);
    mocks.bcryptHash.mockResolvedValue("new-hash");
    mocks.prisma.user.update.mockResolvedValue({});
    mocks.prisma.emailToken.deleteMany.mockResolvedValue({});
    mocks.prisma.$transaction.mockImplementation((ops) => Promise.all(ops));
    mocks.sendPasswordResetConfirmationEmail.mockRejectedValue(
      new Error("SMTP error"),
    );

    const result = await changePassword("user-1", baseInput);

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
    });
    expect(mocks.bcryptCompare).toHaveBeenNthCalledWith(
      1,
      "OldPassword123",
      "old-hash",
    );
    expect(mocks.bcryptCompare).toHaveBeenNthCalledWith(
      2,
      "NewPassword123",
      "old-hash",
    );
    expect(mocks.bcryptHash).toHaveBeenCalledWith("NewPassword123", 10);
    expect(mocks.prisma.$transaction).toHaveBeenCalled();
    expect(mocks.prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { password: "new-hash", tokenVersion: { increment: 1 } },
    });
    expect(mocks.prisma.emailToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", type: "RESET_PASSWORD" },
    });
    expect(mocks.sendPasswordResetConfirmationEmail).toHaveBeenCalledWith(
      "test@example.com",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to send password change confirmation email",
    );
    expect(result).toEqual({ message: "Password changed successfully" });

    consoleErrorSpy.mockRestore();
  });
});
