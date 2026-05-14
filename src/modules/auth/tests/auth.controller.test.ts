import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

const registerUserMock = vi.fn();
const verifyEmailMock = vi.fn();
const loginUserMock = vi.fn();
const refreshTokenMock = vi.fn();
const forgotPasswordMock = vi.fn();
const resetPasswordMock = vi.fn();
const changePasswordMock = vi.fn();
const logoutUserMock = vi.fn();

vi.mock("../auth.service.js", () => ({
  registerUser: registerUserMock,
  verifyEmail: verifyEmailMock,
  loginUser: loginUserMock,
  refreshToken: refreshTokenMock,
  forgotPassword: forgotPasswordMock,
  resetPassword: resetPasswordMock,
  changePassword: changePasswordMock,
  logoutUser: logoutUserMock,
}));

const {
  registerController,
  verifyEmailController,
  loginController,
  refreshController,
  forgotPasswordController,
  resetPasswordController,
  changePasswordController,
  logoutController,
  adminCheckController,
} = await import("../auth.controller.js");

const createMockResponse = (): Response => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const longToken = "a".repeat(64);

describe("registerController", () => {
  beforeEach(() => {
    registerUserMock.mockReset();
  });

  it("returns 201 when register succeeds", async () => {
    const req = {
      body: {
        name: "Test User",
        email: "test@mail.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      },
    } as unknown as Request;
    const res = createMockResponse();

    registerUserMock.mockResolvedValue({
      message: "User registered successfully",
    });

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "User registered successfully",
    });
  });

  it("returns 400 when body validation fails", async () => {
    const req = {
      body: {
        name: "",
        email: "bad-email",
        password: "123",
      },
    } as unknown as Request;
    const res = createMockResponse();

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it("returns 409 when email already exists", async () => {
    const req = {
      body: {
        name: "Test User",
        email: "existing@mail.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      },
    } as unknown as Request;
    const res = createMockResponse();

    registerUserMock.mockRejectedValue(new Error("Email already in use"));

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: "Email already in use" });
  });

  it("returns 500 for unexpected errors", async () => {
    const req = {
      body: {
        name: "Test User",
        email: "test@mail.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      },
    } as unknown as Request;
    const res = createMockResponse();

    registerUserMock.mockRejectedValue(new Error("random failure"));

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("verifyEmailController", () => {
  beforeEach(() => {
    verifyEmailMock.mockReset();
  });

  const validToken = "a".repeat(64);

  it("returns 200 when email verification succeeds", async () => {
    const req = {
      query: {
        token: validToken,
      },
    } as unknown as Request;
    const res = createMockResponse();

    verifyEmailMock.mockResolvedValue({
      message: "Email verified successfully",
    });

    await verifyEmailController(req, res);

    expect(verifyEmailMock).toHaveBeenCalledWith(validToken);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Email verified successfully",
    });
  });

  it("returns 400 when token is missing or empty", async () => {
    const req = {
      query: {},
    } as unknown as Request;
    const res = createMockResponse();
    await verifyEmailController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it("returns 401 when token is invalid or expired", async () => {
    const req = {
      query: {
        token: validToken,
      },
    } as unknown as Request;

    const res = createMockResponse();
    verifyEmailMock.mockRejectedValue(
      new Error("Invalid or expired verification token"),
    );

    await verifyEmailController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid or expired verification token",
    });
  });

  it("returns 500 for unexpected errors", async () => {
    const req = { query: { token: validToken } } as unknown as Request;
    const res = createMockResponse();

    verifyEmailMock.mockRejectedValue("Unexpected error");

    await verifyEmailController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("loginController", () => {
  beforeEach(() => {
    loginUserMock.mockReset();
  });

  it("returns 200 when login succeeds", async () => {
    const req = {
      body: {
        email: "test@mail.com",
        password: "Password123!",
      },
    } as unknown as Request;
    const res = createMockResponse();

    const accessToken = "access-token-value";
    const refreshToken = "refresh-token-value";

    loginUserMock.mockResolvedValue({
      accessToken,
      refreshToken,
    });

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      accessToken,
      refreshToken,
    });
  });

  it("returns 400 when body validation fails", async () => {
    const req = {
      body: {
        email: "bad-email",
        password: "",
      },
    } as unknown as Request;
    const res = createMockResponse();
    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it("returns 401 when credentials are invalid", async () => {
    const req = {
      body: {
        email: "test@mail.com",
        password: "Password123!",
      },
    } as unknown as Request;
    const res = createMockResponse();

    loginUserMock.mockRejectedValue(new Error("Invalid credentials"));

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
  });

  it("returns 401 when email is not verified", async () => {
    const req = {
      body: {
        email: "test@mail.com",
        password: "Password123!",
      },
    } as unknown as Request;
    const res = createMockResponse();

    loginUserMock.mockRejectedValue(new Error("Please verify your email"));

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Please verify your email" });
  });

  it("returns 401 when the account is disabled", async () => {
    const req = {
      body: {
        email: "test@mail.com",
        password: "Password123!",
      },
    } as unknown as Request;
    const res = createMockResponse();

    loginUserMock.mockRejectedValue(new Error("Account disabled"));

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Account disabled" });
  });

  it("returns 500 for unexpected errors", async () => {
    const req = {
      body: {
        email: "test@mail.com",
        password: "Password123!",
      },
    } as unknown as Request;
    const res = createMockResponse();

    loginUserMock.mockRejectedValue("Unexpected error");

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("refreshController", () => {
  beforeEach(() => {
    refreshTokenMock.mockReset();
  });

  it("returns 200 when token refresh succeeds", async () => {
    const req = {
      body: {
        refreshToken: "valid-refresh-token-123",
      },
    } as unknown as Request;

    const res = createMockResponse();

    const newAccessToken = "new-access-token-value";

    refreshTokenMock.mockResolvedValue({
      accessToken: newAccessToken,
    });

    await refreshController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      accessToken: newAccessToken,
    });
  });

  it("returns 401 when refresh token is invalid or expired", async () => {
    const req = {
      body: {
        refreshToken: "invalid-refresh-token-123",
      },
    } as unknown as Request;
    const res = createMockResponse();

    refreshTokenMock.mockRejectedValue(
      new Error("Invalid or expired refresh token"),
    );

    await refreshController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid or expired refresh token",
    });
  });

  it("returns 500 for unexpected errors", async () => {
    const req = {
      body: {
        refreshToken: "valid-refresh-token-123",
      },
    } as unknown as Request;
    const res = createMockResponse();

    refreshTokenMock.mockRejectedValue("Unexpected error");
    await refreshController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("forgotPasswordController", () => {
  beforeEach(() => {
    forgotPasswordMock.mockReset();
  });

  it("returns 200 when forgot password request succeeds", async () => {
    const req = {
      body: {
        email: "test@mail.com",
      },
    } as unknown as Request;

    const res = createMockResponse();

    forgotPasswordMock.mockResolvedValue({
      message: "Password reset email sent",
    });

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Password reset email sent",
    });
  });

  it("returns 400 when body validation fails", async () => {
    const req = {
      body: {
        email: "bad-email",
      },
    } as unknown as Request;
    const res = createMockResponse();
    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it("returns 500 when reset email sending fails", async () => {
    const req = {
      body: {
        email: "test@mail.com",
      },
    } as unknown as Request;
    const res = createMockResponse();

    forgotPasswordMock.mockRejectedValue(
      new Error("Error sending reset email"),
    );

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalled();
  });

  it("returns 400 for other known service errors", async () => {
    const req = {
      body: {
        email: "test@mail.com",
      },
    } as unknown as Request;
    const res = createMockResponse();

    forgotPasswordMock.mockRejectedValue(
      new Error("Some service validation error"),
    );

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Some service validation error",
    });
  });

  it("returns 500 for unknown errors", async () => {
    const req = {
      body: {
        email: "test@mail.com",
      },
    } as unknown as Request;

    const res = createMockResponse();

    forgotPasswordMock.mockRejectedValue("random");

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Internal server error",
    });
  });
});

describe("resetPasswordController", () => {
  beforeEach(() => {
    resetPasswordMock.mockReset();
  });

  it("returns 200 when password reset succeeds", async () => {
    const req = {
      body: {
        token: longToken,
        password: "NewPassword123!",
      },
    } as unknown as Request;

    const res = createMockResponse();

    resetPasswordMock.mockResolvedValue({
      message: "Password reset successfully",
    });

    await resetPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Password reset successfully",
    });
  });

  it("returns 400 when body validation fails", async () => {
    const req = {
      body: {
        token: longToken,
        password: "short",
      },
    } as unknown as Request;

    const res = createMockResponse();
    await resetPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it("returns 401 when token is invalid or expired", async () => {
    const req = {
      body: {
        token: longToken,
        password: "NewPassword123!",
      },
    } as unknown as Request;

    const res = createMockResponse();

    resetPasswordMock.mockRejectedValue(
      new Error("Invalid or expired reset token"),
    );

    await resetPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid or expired reset token",
    });
  });

  it("returns 500 for unexpected errors", async () => {
    const req = {
      body: {
        token: longToken,
        password: "NewPassword123!",
      },
    } as unknown as Request;

    const res = createMockResponse();
    resetPasswordMock.mockRejectedValue("Unexpected error");

    await resetPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("changePasswordController", () => {
  beforeEach(() => {
    changePasswordMock.mockReset();
  });

  it("returns 200 when password change succeeds", async () => {
    const req = {
      user: {
        userId: "user-id-123",
      },
      body: {
        currentPassword: "CurrentPassword123!",
        newPassword: "NewPassword123!",
        confirmPassword: "NewPassword123!",
      },
    } as unknown as Request;
    const res = createMockResponse();

    changePasswordMock.mockResolvedValue({
      message: "Password changed successfully",
    });

    await changePasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Password changed successfully",
    });
  });

  it("returns 400 when body validation fails", async () => {
    const req = {
      user: {
        userId: "user-id-123",
      },
      body: {
        currentPassword: "short",
        newPassword: "short",
        confirmPassword: "short",
      }
    } as unknown as Request;
    const res = createMockResponse();
    await changePasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it("returns 401 when the request is not authenticated", async () => {
    const req = {
      body: {
        currentPassword: "CurrentPassword123!",
        newPassword: "NewPassword123!",
        confirmPassword: "NewPassword123!",
      },
    } as unknown as Request;
    const res = createMockResponse();

    await changePasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it("returns 401 when current password is incorrect", async () => {
    const req = {
      user: {
        userId: "user-id-123",
      },
      body: {
        currentPassword: "CurrentPassword123!",
        newPassword: "NewPassword123!",
        confirmPassword: "NewPassword123!",
      },
    } as unknown as Request;
    const res = createMockResponse();

    changePasswordMock.mockRejectedValue(
      new Error("Current password is incorrect"),
    );

    await changePasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Current password is incorrect",
    });
  });

  it("returns 500 for unexpected errors", async () => {
    const req = {
      user: {
        userId: "user-id-123",
      },
      body: {
        currentPassword: "CurrentPassword123!",
        newPassword: "NewPassword123!",
        confirmPassword: "NewPassword123!",
      },
    } as unknown as Request;
    const res = createMockResponse();

    changePasswordMock.mockRejectedValue("Unexpected error");

    await changePasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Internal server error",
    });
  });
});

describe("logoutController", () => {
  beforeEach(() => {
    logoutUserMock.mockReset();
  });

  it("returns 200 when logout succeeds", async () => {
    const req = {
      user: {
        userId: "user-id-123",
      },
    } as unknown as Request;
    const res = createMockResponse();

    logoutUserMock.mockResolvedValue({
      message: "Logged out successfully",
    });

    await logoutController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Logged out successfully",
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    const req = {} as unknown as Request;
    const res = createMockResponse();

    await logoutController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized",
    });
  });

  it("returns 404 when user not found", async () => {
    const req = {
      user: {
        userId: "user-id-123",
      },
    } as unknown as Request;
    const res = createMockResponse();

    logoutUserMock.mockRejectedValue(new Error("User not found"));

    await logoutController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "User not found",
    });
  });

  it("returns 400 for service errors", async () => {
    const req = {
      user: {
        userId: "user-id-123",
      },
    } as unknown as Request;
    const res = createMockResponse();

    logoutUserMock.mockRejectedValue(new Error("Some service error"));

    await logoutController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Some service error",
    });
  });

  it("returns 500 for unexpected errors", async () => {
    const req = {
      user: {
        userId: "user-id-123",
      },
    } as unknown as Request;
    const res = createMockResponse();

    logoutUserMock.mockRejectedValue("Unexpected error");

    await logoutController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Internal server error",
    });
  });
});

describe("adminCheckController", () => {
  it("returns 200 with user data when admin is authenticated", async () => {
    const req = {
      user: {
        userId: "admin-id-123",
        email: "admin@mail.com",
        role: "ADMIN",
      },
    } as unknown as Request;
    const res = createMockResponse();

    await adminCheckController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Admin access granted",
      user: {
        userId: "admin-id-123",
        email: "admin@mail.com",
        role: "ADMIN",
      },
    });
  });
});
