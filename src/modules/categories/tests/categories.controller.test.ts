import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

const createCategorySchema = {
  parse: vi.fn(),
};
const updateCategorySchema = {
  parse: vi.fn(),
};

const createCategoryMock = vi.fn();
const getAllCategoriesMock = vi.fn();
const getCategoryBySlugMock = vi.fn();
const updateCategoryMock = vi.fn();
const softDeleteCategoryMock = vi.fn();
const restoreCategoryMock = vi.fn();

vi.mock("../categories.service.js", () => ({
  createCategory: createCategoryMock,
  getAllCategories: getAllCategoriesMock,
  getCategoryBySlug: getCategoryBySlugMock,
  updateCategory: updateCategoryMock,
  softDeleteCategory: softDeleteCategoryMock,
  restoreCategory: restoreCategoryMock,
}));

vi.mock("../categories.schema.js", () => ({
  createCategorySchema,
  updateCategorySchema,
}));

const {
  createCategoryController,
  getAllCategoriesController,
  getCategoryBySlugController,
  updateCategoryController,
  softDeleteCategoryController,
  restoreCategoryController,
} = await import("../categories.controller.js");

const createMockResponse = (): Response => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("categories.controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCategoryController", () => {
    it("returns 201 when creation succeeds", async () => {
      const req = {
        body: { name: "A", description: "desc" },
      } as unknown as Request;
      const res = createMockResponse();

      createCategorySchema.parse.mockReturnValue({
        name: "A",
        description: "desc",
      });
      createCategoryMock.mockResolvedValue({
        message: "Category created successfully",
      });

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Category created successfully",
      });
    });

    it("returns 409 when service throws conflict", async () => {
      const req = { body: { name: "same" } } as unknown as Request;
      const res = createMockResponse();

      createCategorySchema.parse.mockReturnValue({ name: "same" });
      createCategoryMock.mockRejectedValue(
        new Error("Category already exists"),
      );

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "Category already exists",
      });
    });

    it("returns 409 when service says category is deleted", async () => {
      const req = { body: { name: "deleted" } } as unknown as Request;
      const res = createMockResponse();

      createCategorySchema.parse.mockReturnValue({ name: "deleted" });
      createCategoryMock.mockRejectedValue(
        new Error("Category exists but is deleted. Restore it instead"),
      );

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "Category exists but is deleted. Restore it instead",
      });
    });

    it("returns 400 for validation/service errors", async () => {
      const req = { body: { name: "" } } as unknown as Request;
      const res = createMockResponse();

      createCategorySchema.parse.mockImplementation(() => {
        throw new Error("Name must be at least 2 characters");
      });

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Name must be at least 2 characters",
      });
    });

    it("returns 500 for unexpected errors", async () => {
      const req = {
        body: { name: "A", description: "desc" },
      } as unknown as Request;
      const res = createMockResponse();

      createCategorySchema.parse.mockReturnValue({
        name: "A",
        description: "desc",
      });
      createCategoryMock.mockRejectedValue("boom");

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });

  describe("getAllCategoriesController", () => {
    it("returns 200 with list", async () => {
      const req = {} as unknown as Request;
      const res = createMockResponse();

      getAllCategoriesMock.mockResolvedValue([{ id: "c1" }]);

      await getAllCategoriesController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ id: "c1" }]);
    });
    it("returns 500 on error", async () => {
      const req = {} as unknown as Request;
      const res = createMockResponse();

      getAllCategoriesMock.mockRejectedValue(new Error("DB error"));

      await getAllCategoriesController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });

  describe("getCategoryBySlugController", () => {
    it("returns 400 when slug missing", async () => {
      const req = { params: {} } as unknown as Request;
      const res = createMockResponse();

      await getCategoryBySlugController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Slug is required" });
    });

    it("returns 200 when found", async () => {
      const req = { params: { slug: "a" } } as unknown as Request;
      const res = createMockResponse();

      getCategoryBySlugMock.mockResolvedValue({ id: "c1", slug: "a" });

      await getCategoryBySlugController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: "c1", slug: "a" });
    });

    it("returns 404 when not found", async () => {
      const req = { params: { slug: "a" } } as unknown as Request;
      const res = createMockResponse();

      getCategoryBySlugMock.mockRejectedValue(new Error("Category not found"));

      await getCategoryBySlugController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Category not found" });
    });

    it("returns 400 for other errors", async () => {
      const req = { params: { slug: "a" } } as unknown as Request;
      const res = createMockResponse();
      getCategoryBySlugMock.mockRejectedValue(new Error("DB error"));

      await getCategoryBySlugController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
    });

    it("returns 500 for unexpected errors", async () => {
      const req = { params: { slug: "a" } } as unknown as Request;
      const res = createMockResponse();
      getCategoryBySlugMock.mockRejectedValue("boom");

      await getCategoryBySlugController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });

  describe("updateCategoryController", () => {
    it("returns 400 when id missing", async () => {
      const req = { params: {}, body: {} } as unknown as Request;
      const res = createMockResponse();

      await updateCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Category id is required",
      });
    });

    it("returns 200 on success", async () => {
      const req = {
        params: { id: "c1" },
        body: { name: "New" },
      } as unknown as Request;
      const res = createMockResponse();

      updateCategorySchema.parse.mockReturnValue({ name: "New" });
      updateCategoryMock.mockResolvedValue({
        message: "Category updated successfully",
      });

      await updateCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Category updated successfully",
      });
    });

    it("returns 404 when not found", async () => {
      const req = {
        params: { id: "c1" },
        body: { name: "New" },
      } as unknown as Request;
      const res = createMockResponse();

      updateCategorySchema.parse.mockReturnValue({ name: "New" });
      updateCategoryMock.mockRejectedValue(new Error("Category not found"));

      await updateCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Category not found" });
    });

    it("returns 400 for validation errors", async () => {
      const req = {
        params: { id: "c1" },
        body: { name: "" },
      } as unknown as Request;
      const res = createMockResponse();
      updateCategorySchema.parse.mockImplementation(() => {
        throw new Error("Name must be at least 2 characters");
      });

      await updateCategoryController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Name must be at least 2 characters",
      });
    });

    it("returns 409 for conflict errors", async () => {
      const req = {
        params: { id: "c1" },
        body: { name: "Existing" },
      } as unknown as Request;
      const res = createMockResponse();
      updateCategorySchema.parse.mockReturnValue({ name: "Existing" });
      updateCategoryMock.mockRejectedValue(
        new Error("Category already exists"),
      );

      await updateCategoryController(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "Category already exists",
      });
    });

    it("returns 500 for unexpected errors", async () => {
      const req = {
        params: { id: "c1" },
        body: { name: "New" },
      } as unknown as Request;
      const res = createMockResponse();
      updateCategorySchema.parse.mockReturnValue({ name: "New" });
      updateCategoryMock.mockRejectedValue("boom");

      await updateCategoryController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });

  describe("softDeleteCategoryController", () => {
    it("returns 400 when id missing", async () => {
      const req = { params: {} } as unknown as Request;
      const res = createMockResponse();

      await softDeleteCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Category id is required",
      });
    });

    it("returns 200 on success", async () => {
      const req = { params: { id: "c1" } } as unknown as Request;
      const res = createMockResponse();

      softDeleteCategoryMock.mockResolvedValue({
        message: "Category deleted successfully",
      });

      await softDeleteCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Category deleted successfully",
      });
    });

    it("returns 404 when not found", async () => {
      const req = { params: { id: "c1" } } as unknown as Request;
      const res = createMockResponse();

      softDeleteCategoryMock.mockRejectedValue(new Error("Category not found"));

      await softDeleteCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Category not found" });
    });

    it("returns 400 for other errors", async () => {
      const req = { params: { id: "c1" } } as unknown as Request;
      const res = createMockResponse();
      softDeleteCategoryMock.mockRejectedValue(new Error("DB error"));
      await softDeleteCategoryController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
    });

    it("returns 500 for unexpected errors", async () => {
      const req = { params: { id: "c1" } } as unknown as Request;
      const res = createMockResponse();
      softDeleteCategoryMock.mockRejectedValue("boom");
      await softDeleteCategoryController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });

  describe("restoreCategoryController", () => {
    it("returns 400 when id missing", async () => {
      const req = { params: {} } as unknown as Request;
      const res = createMockResponse();

      await restoreCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Category id is required",
      });
    });

    it("returns 200 on success", async () => {
      const req = { params: { id: "c1" } } as unknown as Request;
      const res = createMockResponse();

      restoreCategoryMock.mockResolvedValue({
        message: "Category restored successfully",
      });

      await restoreCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Category restored successfully",
      });
    });

    it("returns 404 when not found", async () => {
      const req = { params: { id: "c1" } } as unknown as Request;
      const res = createMockResponse();

      restoreCategoryMock.mockRejectedValue(new Error("Category not found"));

      await restoreCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Category not found" });
    });

    it("returns 400 for other errors", async () => {
      const req = { params: { id: "c1" } } as unknown as Request;
      const res = createMockResponse();
      restoreCategoryMock.mockRejectedValue(new Error("DB error"));

      await restoreCategoryController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
    });

    it("returns 500 for unexpected errors", async () => {
      const req = { params: { id: "c1" } } as unknown as Request;
      const res = createMockResponse();
      restoreCategoryMock.mockRejectedValue("boom");

      await restoreCategoryController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });
});
