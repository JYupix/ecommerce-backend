# 🛒 ECommerce API

A clean and practical backend API for an eCommerce platform, built with TypeScript, Express, Prisma, and PostgreSQL.

It includes production-style authentication flows (JWT + refresh, email verification, password recovery, token revocation on logout/password change) and secure API foundations.

## ✨ Highlights

- 🔐 JWT authentication (access + refresh tokens)
- 🚪 Real logout with token invalidation (`tokenVersion`)
- 📧 Email verification flow
- 🔑 Forgot / reset password flow
- 🔄 Secure change-password flow
- 🛡️ Route protection middleware
- ⏱️ Basic auth rate limiting
- 🧱 Prisma + PostgreSQL
- ✅ Input validation with Zod

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

- `src/modules/auth` → auth routes, controller, service, schemas, types
- `src/middleware` → auth middleware + rate limit middleware
- `src/config` → environment + DB + external providers
- `prisma` → schema + migrations

## 🚀 Quick Start

1. Install dependencies
2. Configure `.env`
3. Run database migrations
4. Start development server

## 🔒 Auth Endpoints

- `POST /auth/register`
- `GET /auth/verify-email`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/change-password`

## 🧪 Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run typecheck`
- `npm run prisma:migrate`
- `npm run prisma:generate`

## 🎯 Goal

Build a strong backend base for an eCommerce system with secure auth, clean architecture, and room to scale into products, carts, orders, and payments.

## 👨‍💻 Author

Built by a backend developer focused on solid junior-to-mid engineering practices.
