# 🛒 ECommerce API

A clean and practical backend API for an eCommerce platform, built with TypeScript, Express, Prisma, and PostgreSQL.

It includes production-style authentication flows (JWT + refresh, email verification, password recovery, token revocation on logout/password change) and secure API foundations.

## ✨ Highlights

- 🔐 JWT authentication (access + refresh tokens with `tokenVersion` revocation)
- 🚪 Real logout with token invalidation
- 📧 Email verification flow
- 🔑 Forgot / reset password flow with token expiry
- 🔄 Secure change-password flow
- 👤 Role-based access control (USER / ADMIN)
- 🏷️ Categories CRUD with soft delete pattern
- 📚 Swagger/OpenAPI documentation at `/docs`
- 🧪 Manual test checklists included
- 🛡️ Route protection & rate limiting
- ✅ Input validation with Zod
- 🧱 Prisma + PostgreSQL with migrations

## 🧰 Tech Stack

- TypeScript
- Express
- Prisma ORM
- PostgreSQL
- JWT (`jsonwebtoken`)
- Zod
- Resend (email sending)
- Helmet
- Morgan

## 📁 Project Structure

- `src/modules/auth` → authentication (register, login, logout, password recovery)
- `src/modules/categories` → categories CRUD with soft delete & restore
- `src/middleware` → auth validation, role-based access, rate limiting
- `src/config` → environment variables, database, external services
- `src/docs` → Swagger/OpenAPI documentation
- `docs/manual-tests` → manual testing checklists
- `prisma` → schema + migrations

## 🚀 Quick Start

1. Install dependencies
2. Configure `.env`
3. Run database migrations
4. Start development server

## 🔒 Auth Endpoints

- `POST /auth/register` → Create account
- `GET /auth/verify-email` → Verify email with token
- `POST /auth/login` → Login with email/password
- `POST /auth/refresh` → Refresh access token
- `POST /auth/logout` → Logout & revoke tokens
- `POST /auth/forgot-password` → Request password reset
- `POST /auth/reset-password` → Reset password with token
- `POST /auth/change-password` → Change password (authenticated)

## 🏷️ Categories Endpoints

- `GET /categories` → List all active categories (public)
- `GET /categories/slug/:slug` → Get category by slug (public)
- `POST /categories` → Create category (admin only)
- `PATCH /categories/:id` → Update category (admin only)
- `DELETE /categories/:id` → Soft delete category (admin only)
- `PATCH /categories/:id/restore` → Restore deleted category (admin only)

## 📚 API Documentation

Visit `/docs` after starting the server to access Swagger/OpenAPI interactive documentation with all endpoints, request/response schemas, and HTTP status codes.

## 🧪 Scripts

- `npm run dev` → Start development server with hot reload
- `npm run build` → Build TypeScript to JavaScript
- `npm run start` → Start production server
- `npm run typecheck` → Run TypeScript compiler check
- `npm run prisma:migrate` → Run database migrations
- `npm run prisma:generate` → Generate Prisma client

## 📋 Testing

Manual test checklists are available in `docs/manual-tests/` for:
- Auth flows (register, login, logout, password recovery)
- Categories CRUD operations

Each endpoint is documented with expected HTTP status codes and response formats.

## 🎯 Roadmap

**Completed** ✅
- Authentication system (register, login, logout, password recovery)
- Token revocation via `tokenVersion`
- Role-based access control (USER/ADMIN)
- Categories module with soft delete/restore
- Swagger/OpenAPI documentation

**In Progress** 🚧
- Products module
- Product variants & images
- Shopping cart

**Planned** 📅
- Orders & checkout
- Payment integration
- Inventory management
- Advanced filtering & search

## 💡 Architecture Highlights

- **Soft Delete Pattern**: Categories, Products, and Variants support soft delete for data integrity
- **Token Revocation**: `tokenVersion` field enables instant token invalidation on logout or password changes
- **Role-Based Access**: Middleware enforces permissions (ADMIN-only endpoints for write operations)
- **Swagger Integration**: Centralized API documentation with automatic request/response schema validation
- **Type Safety**: Full TypeScript with Prisma generated types

## 👨‍💻 Author

Built by a backend developer focused on solid junior-to-mid engineering practices.
