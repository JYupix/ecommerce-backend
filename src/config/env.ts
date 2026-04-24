const getRequiredEnv = (key: string): string => {
    const value = process.env[key];

    if (!value) {
        throw new Error(`${key} is missing from the .env file. Please add it to proceed.`);
    }

    return value;
};

const port = Number(process.env.PORT ?? 3000);

if (Number.isNaN(port) || port <= 0) {
    throw new Error("PORT must be a valid positive number.");
}

export const env = {
    PORT: port,
    NODE_ENV: process.env.NODE_ENV ?? "development",
    DATABASE_URL: getRequiredEnv("DATABASE_URL"),
    RESEND_API_KEY: getRequiredEnv("RESEND_API_KEY"),
    APP_URL: getRequiredEnv("APP_URL"),
    RESEND_FROM_EMAIL: getRequiredEnv("RESEND_FROM_EMAIL"),
    JWT_SECRET: getRequiredEnv("JWT_SECRET"),
    JWT_REFRESH_SECRET: getRequiredEnv("JWT_REFRESH_SECRET"),
};