import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
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
  sendPasswordResetConfirmationEmail: vi.fn(),
}));

const { logoutUser } = await import("../../auth.service.js");

const resetMocks = () => {
  vi.clearAllMocks();
  mocks.env.NODE_ENV = "development";
};

describe("logoutUser", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("should increment tokenVersion and logout successfully", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      tokenVersion: 1,
    });
    mocks.prisma.user.update.mockResolvedValue({
      id: "user-1",
      tokenVersion: 2,
    });

    const result = await logoutUser("user-1");

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
    });
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { tokenVersion: { increment: 1 } },
    });
    expect(mocks.prisma.user.update).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ message: "Logged out successfully" });
  });

  it("should throw an error if user is not found", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);

    await expect(logoutUser("user-1")).rejects.toThrow("User not found");

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
    });
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.user.update).not.toHaveBeenCalled();
  });
});
