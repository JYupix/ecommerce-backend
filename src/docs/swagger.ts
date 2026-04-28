import swaggerJsdoc from "swagger-jsdoc";
import { env } from "../config/env.js";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "ECommerce API",
      version: "1.0.0",
      description: "API documentation for the ECommerce backend.",
    },
    servers: [
      {
        url: env.APP_URL,
        description: "Current API server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "string",
            },
          },
          required: ["error"],
        },
        MessageResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
            },
          },
          required: ["message"],
        },
        RegisterResponse: {
          allOf: [
            {
              $ref: "#/components/schemas/MessageResponse",
            },
            {
              type: "object",
              properties: {
                verificationToken: {
                  type: "string",
                  description: "Returned only in development to test email verification without inbox access.",
                },
              },
            },
          ],
        },
        AuthTokens: {
          type: "object",
          properties: {
            accessToken: {
              type: "string",
            },
            refreshToken: {
              type: "string",
            },
          },
          required: ["accessToken", "refreshToken"],
        },
        RegisterRequest: {
          type: "object",
          properties: {
            name: {
              type: "string",
              example: "John Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              example: "Password123",
            },
            confirmPassword: {
              type: "string",
              example: "Password123",
            },
          },
          required: ["name", "email", "password", "confirmPassword"],
        },
        LoginRequest: {
          type: "object",
          properties: {
            email: {
              type: "string",
              format: "email",
            },
            password: {
              type: "string",
            },
          },
          required: ["email", "password"],
        },
        ForgotPasswordRequest: {
          type: "object",
          properties: {
            email: {
              type: "string",
              format: "email",
            },
          },
          required: ["email"],
        },
        ResetPasswordRequest: {
          type: "object",
          properties: {
            token: {
              type: "string",
              example: "verification-token",
            },
            password: {
              type: "string",
              example: "NewPassword123",
            },
          },
          required: ["token", "password"],
        },
        ChangePasswordRequest: {
          type: "object",
          properties: {
            currentPassword: {
              type: "string",
            },
            newPassword: {
              type: "string",
            },
            confirmPassword: {
              type: "string",
            },
          },
          required: ["currentPassword", "newPassword", "confirmPassword"],
        },
        Category: {
          type: "object",
          properties: {
            id: {
              type: "string",
            },
            name: {
              type: "string",
            },
            slug: {
              type: "string",
            },
            description: {
              type: ["string", "null"],
            },
            isActive: {
              type: "boolean",
            },
            deletedAt: {
              type: ["string", "null"],
              format: "date-time",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
          required: ["id", "name", "slug", "isActive", "createdAt", "updatedAt"],
        },
        CreateCategoryRequest: {
          type: "object",
          properties: {
            name: {
              type: "string",
              example: "Electronics",
            },
            description: {
              type: "string",
              example: "Technology products",
            },
          },
          required: ["name"],
        },
        UpdateCategoryRequest: {
          type: "object",
          properties: {
            name: {
              type: "string",
              example: "Home Electronics",
            },
            description: {
              type: "string",
              example: "Updated description",
            },
            isActive: {
              type: "boolean",
            },
          },
        },
      },
    },
  },
  apis: ["./src/docs/*.ts"],
});
