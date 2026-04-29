import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RegisterInput } from "../../auth.types.js";

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

const { registerUser } = await import("../../auth.service.js");

const baseInput: RegisterInput = {
  name: "Test User",
  email: "Test@Mail.com",
  password: "Password123",
  confirmPassword: "Password123",
};

const resetMocks = () => {
  vi.clearAllMocks();
  mocks.env.NODE_ENV = "development";
};

describe("registerUser", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("creates a new user and returns a verification token in development", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.bcryptHash.mockResolvedValue("hashed-password");
    mocks.prisma.user.create.mockResolvedValue({ id: "user-1" });
    mocks.generateToken.mockReturnValue("token-123");
    mocks.prisma.emailToken.deleteMany.mockResolvedValue({ count: 0 });
    mocks.prisma.emailToken.create.mockResolvedValue({});
    mocks.sendVerificationEmail.mockResolvedValue(undefined);

    const result = await registerUser(baseInput);

    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@mail.com" },
    });
    expect(mocks.bcryptHash).toHaveBeenCalledWith("Password123", 10);
    expect(mocks.prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: "Test User",
        email: "test@mail.com",
        password: "hashed-password",
      },
    });
    expect(mocks.generateToken).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.emailToken.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "VERIFY_EMAIL",
        token: "token-123",
        expiresAt: expect.any(Date),
      },
    });
    expect(mocks.sendVerificationEmail).toHaveBeenCalledWith(
      "test@mail.com",
      "token-123",
    );
    expect(result).toEqual({
      message: "User registered successfully",
      verificationToken: "token-123",
    });
  });

  it("creates a new user without exposing the token in production", async () => {
    mocks.env.NODE_ENV = "production";
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.bcryptHash.mockResolvedValue("hashed-password");
    mocks.prisma.user.create.mockResolvedValue({ id: "user-1" });
    mocks.generateToken.mockReturnValue("token-123");
    mocks.prisma.emailToken.deleteMany.mockResolvedValue({ count: 0 });
    mocks.prisma.emailToken.create.mockResolvedValue({});
    mocks.sendVerificationEmail.mockResolvedValue(undefined);

    const result = await registerUser(baseInput);

    expect(result).toEqual({ message: "User registered successfully" });
    expect(result).not.toHaveProperty("verificationToken");
  });

  it("throws when the email already belongs to a verified account", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email_verified: true,
    });

    await expect(registerUser(baseInput)).rejects.toThrow(
      "Email already in use",
    );
    expect(mocks.bcryptHash).not.toHaveBeenCalled();
    expect(mocks.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("resends verification email and returns the token for an unverified account", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email_verified: false,
    });
    mocks.prisma.emailToken.deleteMany.mockResolvedValue({ count: 1 });
    mocks.generateToken.mockReturnValue("token-456");
    mocks.prisma.emailToken.create.mockResolvedValue({});
    mocks.sendVerificationEmail.mockResolvedValue(undefined);

    const result = await registerUser(baseInput);

    expect(mocks.prisma.emailToken.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        type: "VERIFY_EMAIL",
      },
    });
    expect(mocks.prisma.user.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      message: "Verification email resent",
      verificationToken: "token-456",
    });
  });

  it("returns the token when verification email fails in development", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email_verified: false,
    });
    mocks.prisma.emailToken.deleteMany.mockResolvedValue({ count: 1 });
    mocks.generateToken.mockReturnValue("token-789");
    mocks.prisma.emailToken.create.mockResolvedValue({});
    mocks.sendVerificationEmail.mockRejectedValue(new Error("mail error"));

    const result = await registerUser(baseInput);

    expect(result).toEqual({
      message:
        "Account exists but verification email could not be sent. Try again",
      verificationToken: "token-789",
    });
    expect(mocks.prisma.emailToken.deleteMany).toHaveBeenCalledTimes(1);
  });
});

