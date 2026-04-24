import { resend } from "../config/resend.js";
import { env } from "../config/env.js";

export const sendVerificationEmail = async (
  email: string,
  token: string,
): Promise<void> => {
  const verificationLink = `${env.APP_URL}/auth/verify-email?token=${token}`;

  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL!,
    to: email,
    subject: "Verify your email",
    html: `
      <h2>Verify your email</h2>
      <p>Click the link below to verify your account. It expires in 24 hours.</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>Or copy this link: ${verificationLink}</p>
    `,
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

export const sendResetPasswordEmail = async (
  email: string,
  token: string,
): Promise<void> => {
  const url = `${env.APP_URL}/auth/reset-password?token=${token}`;

  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL as string,
    to: email,
    subject: "Restablece tu contraseña",
    html: `
      <div style="font-family: Arial;">
        <h2>Password Recovery</h2>
        <p>Click the following link:</p>
        <a href="${url}">Reset password</a>
        <p>This link expires in 1 hour.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send reset password email: ${error.message}`);
  }
};

export const sendPasswordChangedEmail = async (
  email: string,
): Promise<void> => {
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL as string,
    to: email,
    subject: "Your password has been changed",
    html: `
      <div style="font-family: Arial;">
        <h2>Password Updated</h2>
        <p>Your password was changed successfully.</p>
        <p>If you did not make this change, contact support immediately.</p>
      </div>
    `,
  });
};

export const sendPasswordResetConfirmationEmail = async (
  email: string
): Promise<void> => {
  const now = new Date().toLocaleString();

  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: email,
    subject: "Your password has been updated",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Password updated</h2>
        <p>Your password was changed successfully.</p>
        <p><strong>Date:</strong> ${now}</p>
        <p>If you did not make this change, we recommend:</p>
        <ul>
          <li>Change your password immediately</li>
          <li>Review your account activity</li>
          <li>Contact support</li>
        </ul>
        <p style="color: #555;">This is an automated email, please do not reply.</p>
      </div>
    `,
    text: `Your password was changed successfully on ${now}. If you did not make this change, please change your password immediately and contact support.`,
  });

  if (error) {
    throw new Error(`Failed to send password changed email: ${error.message}`);
  }
};