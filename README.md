# ECommerce API

Backend API for an eCommerce platform built with TypeScript, Express, Prisma, and PostgreSQL.

It includes JWT authentication, email verification, password recovery, role-based access, Swagger documentation, and a Render-ready deployment setup.

## Live Demo

Try the API documentation here:

- https://ecommerce-backend-o0qg.onrender.com/docs/

## Highlights

- ✅ **72 comprehensive unit tests** with Vitest (service + controller layer)
- JWT authentication with access and refresh tokens
- Real session revocation with `tokenVersion`
- Email verification flow
- Password recovery and password change flows
- Role-based access control (`USER` / `ADMIN`)
- Categories CRUD with soft delete
- Interactive Swagger/OpenAPI documentation at `/docs`
- Request validation with Zod
- Prisma + PostgreSQL with migrations
- GitHub Actions CI

## Tech Stack

- 🟦 TypeScript
- ⚡ Express
- 🧩 Prisma ORM
- 🗄️ PostgreSQL
- 🔐 JSON Web Token
- ✅ Zod
- ✉️ Resend
- 🛡️ Helmet
- 📝 Morgan
- 🧪 Vitest
- 🌐 Swagger / OpenAPI

## Project Structure

- `src/modules/auth` - registration, login, verification, refresh, logout, and password reset
- `src/modules/categories` - categories CRUD with soft delete
- `src/middleware` - authentication, roles, and rate limiting
- `src/config` - environment, database, and external services
- `src/docs` - Swagger documentation
- `prisma` - schema and migrations
- `docs/manual-tests` - manual testing checklists

## Swagger

Interactive API documentation is available at:

- `/docs`

From Swagger you can:

- Test endpoints without Postman
- See request and response examples
- Run the `register` and `verify-email` flow
- Copy the verification token in development when email is unavailable

## Auth Flow

- `POST /auth/register` - create a new user
- `GET /auth/verify-email` - verify email using a token
- `POST /auth/login` - return access and refresh tokens
- `POST /auth/refresh` - renew the access token
- `POST /auth/logout` - revoke the session
- `POST /auth/forgot-password` - start the password recovery flow
- `POST /auth/reset-password` - reset the password using a token
- `POST /auth/change-password` - change the password while authenticated

In development, `POST /auth/register` may return `verificationToken` in the response so you can test the flow in Swagger or Render without relying on email delivery.

## Categories

- `GET /categories` - list active categories
- `GET /categories/slug/:slug` - find a category by slug
- `POST /categories` - create a category, admin only
- `PATCH /categories/:id` - update a category, admin only
- `DELETE /categories/:id` - soft delete a category, admin only
- `PATCH /categories/:id/restore` - restore a deleted category, admin only

## Environment Variables

Example configuration:

```dotenv
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
RESEND_API_KEY=your_resend_api_key
APP_URL=https://your-api.onrender.com
RESEND_FROM_EMAIL=onboarding@resend.dev
JWT_SECRET=your_long_secret
JWT_REFRESH_SECRET=your_long_refresh_secret
PORT=3000
NODE_ENV=production
```

## Quick Start

1. Install dependencies
2. Configure `.env`
3. Generate Prisma Client
4. Run migrations
5. Start the server

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Scripts

- `npm run dev` - start the development server with hot reload
- `npm run build` - generate Prisma Client and compile TypeScript
- `npm start` - start the production server
- `npm run typecheck` - run the TypeScript compiler check
- `npm run test` - run the test suite
- `npm run prisma:generate` - generate Prisma Client
- `npm run prisma:migrate` - create/apply migrations in development
- `npm run prisma:studio` - open Prisma Studio

## Testing

Comprehensive test coverage with **72 passing tests** using Vitest:

### Service Layer Tests (37 tests)
- **Login & Refresh:** 5 + 5 = 10 tests
  - Valid credentials, invalid passwords, non-existent users, expired tokens
- **Registration & Email Verification:** 5 + 6 = 11 tests
  - Email validation, duplicate accounts, token expiration
- **Password Recovery:** 3 + 6 = 9 tests
  - Forgot password flow, reset with invalid/expired tokens, email failures
- **Password Change:** 5 tests
  - Current password validation, new password constraints, email confirmation
- **Logout:** 2 tests
  - Token version invalidation, user not found

### Controller Tests (35 tests)
- Full HTTP request/response validation
- Error handling and status codes
- Middleware integration (auth, role-based access)
- Request validation with Zod

**Run tests:**
```bash
npm run test
```

**Manual flow validation in Swagger:**
- Registration & Email verification
- Login & Refresh token
- Password reset & change
- Logout session revocation

## Deployment on Render

The project is ready for Render deployment.

- Connect the GitHub repository
- Create a Web Service
- Configure the environment variables
- Add a PostgreSQL database
- Run migrations with `npx prisma migrate deploy`

Swagger is available at `/docs`, and the root URL redirects there.

## Roadmap

### Completed

- Full JWT auth with refresh tokens
- Email verification
- Password recovery
- Role-based route protection
- Categories module
- Swagger/OpenAPI documentation
- GitHub Actions CI

### In Progress

- Products module
- Product variants and images
- Shopping cart

### Planned

- Orders and checkout
- Payment integration
- Inventory management
- Search and filtering

## Author

Backend API built with a focus on clarity, maintainability, and learning-friendly documentation.
