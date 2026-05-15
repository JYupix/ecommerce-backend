import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    category: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../../../../config/db.js", () => ({
  prisma: mocks.prisma,
}));

vi.mock("slugify", () => ({
  default: (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
}));

const {
  createCategory,
  getAllCategories,
  getCategoryBySlug,
  updateCategory,
  softDeleteCategory,
  restoreCategory,
} = await import("../../categories.service.js");

const resetMocks = () => {
  vi.clearAllMocks();
};

describe("categories.service", () => {
  beforeEach(() => resetMocks());

  describe("createCategory", () => {
    it("creates a category when slug not exists", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue(null);
      mocks.prisma.category.create.mockResolvedValue({});

      const result = await createCategory({ name: "New Cat" });

      expect(mocks.prisma.category.findUnique).toHaveBeenCalledWith({ where: { slug: "new-cat" } });
      expect(mocks.prisma.category.create).toHaveBeenCalled();
      expect(result).toEqual({ message: "Category created successfully" });
    });

    it("throws when category exists and active", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue({ id: "c1", deletedAt: null });

      await expect(createCategory({ name: "Existing" })).rejects.toThrow("Category already exists");
    });

    it("throws when category exists but deleted", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue({ id: "c1", deletedAt: new Date() });

      await expect(createCategory({ name: "Deleted" })).rejects.toThrow("Category exists but is deleted. Restore it instead");
    });
  });

  describe("getAllCategories", () => {
    it("returns list of active categories", async () => {
      const list = [{ id: "c1" }, { id: "c2" }];
      mocks.prisma.category.findMany.mockResolvedValue(list);

      const result = await getAllCategories();

      expect(mocks.prisma.category.findMany).toHaveBeenCalledWith({
        where: { isActive: true, deletedAt: null },
        orderBy: { createdAt: "asc" },
      });
      expect(result).toBe(list);
    });
  });

  describe("getCategoryBySlug", () => {
    it("returns category when found", async () => {
      const cat = { id: "c1", slug: "a" };
      mocks.prisma.category.findFirst.mockResolvedValue(cat);

      const result = await getCategoryBySlug("a");

      expect(mocks.prisma.category.findFirst).toHaveBeenCalledWith({ where: { slug: "a", isActive: true, deletedAt: null } });
      expect(result).toBe(cat);
    });

    it("throws when not found", async () => {
      mocks.prisma.category.findFirst.mockResolvedValue(null);

      await expect(getCategoryBySlug("missing")).rejects.toThrow("Category not found");
    });
  });

  describe("updateCategory", () => {
    it("updates name and slug successfully", async () => {
      mocks.prisma.category.findUnique.mockResolvedValueOnce({ id: "c1", deletedAt: null });
      mocks.prisma.category.findUnique.mockResolvedValueOnce(null); // check slug uniqueness
      mocks.prisma.category.update.mockResolvedValue({});

      const result = await updateCategory("c1", { name: "New Name" });

      expect(mocks.prisma.category.findUnique).toHaveBeenCalled();
      expect(mocks.prisma.category.update).toHaveBeenCalledWith({ where: { id: "c1" }, data: expect.objectContaining({ name: "New Name" }) });
      expect(result).toEqual({ message: "Category updated successfully" });
    });

    it("throws when category not found", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue(null);

      await expect(updateCategory("nope", { name: "x" })).rejects.toThrow("Category not found");
    });

    it("throws when next slug exists on another record", async () => {
      mocks.prisma.category.findUnique.mockResolvedValueOnce({ id: "c1", deletedAt: null });
      mocks.prisma.category.findUnique.mockResolvedValueOnce({ id: "c2" });

      await expect(updateCategory("c1", { name: "Other" })).rejects.toThrow("Category already exists");
    });
  });

  describe("softDeleteCategory", () => {
    it("soft deletes an existing category", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue({ id: "c1", deletedAt: null });
      mocks.prisma.category.update.mockResolvedValue({});

      const result = await softDeleteCategory("c1");

      expect(mocks.prisma.category.update).toHaveBeenCalledWith({ where: { id: "c1" }, data: { isActive: false, deletedAt: expect.any(Date) } });
      expect(result).toEqual({ message: "Category deleted successfully" });
    });

    it("throws when not found or already deleted", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue(null);

      await expect(softDeleteCategory("c1")).rejects.toThrow("Category not found");
    });
  });

  describe("restoreCategory", () => {
    it("restores a deleted category", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue({ id: "c1", deletedAt: new Date() });
      mocks.prisma.category.update.mockResolvedValue({});

      const result = await restoreCategory("c1");

      expect(mocks.prisma.category.update).toHaveBeenCalledWith({ where: { id: "c1" }, data: { isActive: true, deletedAt: null } });
      expect(result).toEqual({ message: "Category restored successfully" });
    });

    it("throws when not deleted or not found", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue({ id: "c1", deletedAt: null });

      await expect(restoreCategory("c1")).rejects.toThrow("Category not found");
    });
  });
});
