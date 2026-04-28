process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-jwt-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test-jwt-refresh-secret";
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://user:pass@localhost:5432/testdb";
