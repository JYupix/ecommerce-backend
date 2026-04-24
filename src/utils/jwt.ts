import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const JWT_SECRET = env.JWT_SECRET;
const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET;

export const generateAccessToken = (userId: string, tokenVersion: number): string => {
    return jwt.sign({ userId, tokenVersion }, JWT_SECRET, { expiresIn: "15m" });
}

export const generateRefreshToken = (userId: string, tokenVersion: number): string => {
    return jwt.sign({ userId, tokenVersion }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}