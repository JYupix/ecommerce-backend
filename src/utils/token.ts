import crypto from "crypto";

export const generateToken = (bytes: number = 32): string => {
  return crypto.randomBytes(bytes).toString("hex");
};