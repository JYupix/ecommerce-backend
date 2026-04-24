import { prisma } from "../../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

import {
  RegisterInput,
  AuthResponse,
  LoginInput,
  AuthTokens,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from "./auth.types.js";
import { generateToken } from "../../utils/token.js";
import {
  sendPasswordChangedEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendPasswordResetConfirmationEmail,
} from "../../utils/email.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";

interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

export const registerUser = async (
  data: RegisterInput,
): Promise<AuthResponse> => {
  const { name, email, password } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) throw new Error("Email already in use");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  await prisma.emailToken.deleteMany({
    where: {
      userId: user.id,
      type: "VERIFY_EMAIL",
    },
  });

  const token = generateToken();

  await prisma.emailToken.create({
    data: {
      userId: user.id,
      type: "VERIFY_EMAIL",
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  try {
    await sendVerificationEmail(email, token);
  } catch (error) {
    await prisma.emailToken.delete({
      where: { token },
    });
    throw new Error("Failed to send verification email");
  }

  return { message: "User registered successfully" };
};

export const verifyEmail = async (token: string): Promise<AuthResponse> => {
  const emailToken = await prisma.emailToken.findUnique({
    where: { token },
  });

  if (!emailToken) throw new Error("Invalid or expired verification token");

  if (emailToken.expiresAt < new Date()) {
    await prisma.emailToken.delete({
      where: { token },
    });
    throw new Error("Verification token has expired");
  }

  if (emailToken.type !== "VERIFY_EMAIL") {
    throw new Error("Invalid token type");
  }

  const user = await prisma.user.findUnique({
    where: { id: emailToken.userId },
  });

  if (!user) throw new Error("User not found");

  if (user.email_verified) {
    await prisma.emailToken.delete({
      where: { token },
    });
    return { message: "Email already verified" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email_verified: true,
      email_verified_at: new Date(),
    },
  });

  await prisma.emailToken.delete({
    where: { token },
  });

  return { message: "Email verified successfully" };
};

export const loginUser = async (data: LoginInput): Promise<AuthTokens> => {
  const { email, password } = data;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (!user.email_verified) throw new Error("Please verify your email");

  if (!user.is_active) throw new Error("Account disabled");

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const accessToken = generateAccessToken(user.id, user.tokenVersion);
  const refreshToken = generateRefreshToken(user.id, user.tokenVersion);

  return { accessToken, refreshToken };
};

export const refreshToken = async (
  token: string,
): Promise<{ accessToken: string }> => {
  try {
    const decoded = jwt.verify(
      token,
      env.JWT_REFRESH_SECRET as string,
    ) as RefreshTokenPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.is_active) {
      throw new Error("Unauthorized");
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      throw new Error("Refresh token revoked");
    }

    const newAccessToken = generateAccessToken(user.id, user.tokenVersion);

    return { accessToken: newAccessToken };
  } catch {
    throw new Error("Invalid or expired refresh token");
  }
};

export const forgotPassword = async (
  data: ForgotPasswordInput,
): Promise<AuthResponse> => {
  const { email } = data;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { message: "If the email exists, a reset link has been sent" };
  }

  await prisma.emailToken.deleteMany({
    where: {
      userId: user.id,
      type: "RESET_PASSWORD",
    },
  });

  const token = generateToken();

  await prisma.emailToken.create({
    data: {
      userId: user.id,
      type: "RESET_PASSWORD",
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  try {
    await sendResetPasswordEmail(email, token);
  } catch (error) {
    await prisma.emailToken.deleteMany({
      where: { userId: user.id, type: "RESET_PASSWORD" },
    });
    throw new Error("Error sending reset email");
  }

  return { message: "If the email exists, a reset link has been sent" };
};

export const resetPassword = async (
  data: ResetPasswordInput,
): Promise<AuthResponse> => {
  const { token, password: newPassword } = data;

  const emailToken = await prisma.emailToken.findUnique({
    where: { token },
  });

  if (!emailToken) throw new Error("Invalid or expired reset token");

  if (emailToken.expiresAt < new Date()) {
    await prisma.emailToken.delete({
      where: { token },
    });
    throw new Error("Reset token has expired");
  }

  if (emailToken.type !== "RESET_PASSWORD") {
    throw new Error("Invalid token type");
  }

  const user = await prisma.user.findUnique({
    where: { id: emailToken.userId },
    select: {
      email: true,
    },
  });

  if (!user) throw new Error("User not found");

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: emailToken.userId },
      data: {
        password: hashedPassword,
        tokenVersion: {
          increment: 1,
        },
      },
    }),
    prisma.emailToken.delete({
      where: { token },
    }),
  ]);

  try {
    await sendPasswordChangedEmail(user.email);
  } catch {
    console.error("Failed to send password changed email");
  }

  return { message: "Password reset successfully" };
};

export const changePassword = async (
  userId: string,
  data: ChangePasswordInput,
): Promise<AuthResponse> => {
  const { currentPassword, newPassword } = data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new Error("Current password is incorrect");

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) throw new Error("New password must be different");

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        tokenVersion: {
          increment: 1,
        },
      },
    }),
    prisma.emailToken.deleteMany({
      where: {
        userId: user.id,
        type: "RESET_PASSWORD",
      },
    }),
  ]);

  try {
    await sendPasswordResetConfirmationEmail(user.email);
  } catch {
    console.error("Failed to send password change confirmation email");
  }

  return { message: "Password changed successfully" };
};

export const logoutUser = async (userId: string): Promise<AuthResponse> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      tokenVersion: {
        increment: 1,
      },
    },
  });

  return { message: "Logged out successfully" };
};
