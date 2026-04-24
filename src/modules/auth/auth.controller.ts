import { Response, Request } from "express";
import { changePassword, forgotPassword, loginUser, logoutUser, refreshToken, registerUser, resetPassword, verifyEmail } from "./auth.service.js";
import { changePasswordSchema, forgotPasswordSchema, loginSchema, refreshSchema, registerSchema, resetPasswordSchema, verifyEmailSchema } from "./auth.schema.js";

const unauthorizedMessages = new Set([
  "Invalid credentials",
  "Please verify your email",
  "Account disabled",
  "Invalid or expired refresh token",
  "Invalid or expired verification token",
  "Verification token has expired",
  "Invalid or expired reset token",
  "Reset token has expired",
  "Invalid token type",
  "Current password is incorrect",
]);

export const registerController = async (req: Request, res: Response) => {
  const parsedData = registerSchema.safeParse(req.body);

  if (!parsedData.success) {
    return res.status(400).json({ error: parsedData.error.flatten() });
  }

  try {
    const result = await registerUser(parsedData.data);
    return res.status(201).json(result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Email already in use") {
      return res.status(409).json({ error: error.message });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyEmailController = async (req: Request, res: Response) => {
  const parsedData = verifyEmailSchema.safeParse(req.query);

  if (!parsedData.success) {
    return res.status(400).json({ error: parsedData.error.flatten() });
  }

  try {
    const result = await verifyEmail(parsedData.data.token);
    return res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (unauthorizedMessages.has(error.message)) {
        return res.status(401).json({ error: error.message });
      }

      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const parsedData = loginSchema.parse(req.body);
    const result = await loginUser(parsedData);

    return res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (unauthorizedMessages.has(error.message)) {
        return res.status(401).json({ error: error.message });
      }

      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

export const refreshController = async (req: Request, res: Response) => {
  try {
    const parsedData = refreshSchema.parse(req.body);
    const result = await refreshToken(parsedData.refreshToken);

    return res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(401).json({ error: error.message });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

export const forgotPasswordController = async (req: Request, res: Response) => {
  try {
    const parsedData = forgotPasswordSchema.parse(req.body);
    const result = await forgotPassword(parsedData);

    return res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Error sending reset email") {
        return res.status(500).json({ error: error.message });
      }

      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}

export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const parsedData = resetPasswordSchema.parse(req.body);
    const result = await resetPassword(parsedData);
    return res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (unauthorizedMessages.has(error.message)) {
        return res.status(401).json({ error: error.message });
      }

      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}

export const changePasswordController = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const parsedData = changePasswordSchema.parse(req.body);

    const result = await changePassword(req.user.userId, parsedData);
    return res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (unauthorizedMessages.has(error.message)) {
        return res.status(401).json({ error: error.message });
      }

      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

export const logoutController = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await logoutUser(req.user.userId);
    return res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "User not found") {
        return res.status(404).json({ error: error.message });
      }

      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};