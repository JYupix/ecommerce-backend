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
  slugify: vi.fn((s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
}));

vi.mock("../../../../config/db.js", () => ({
  prisma: mocks.prisma,
}));

vi.mock("slugify", () => ({ default: mocks.slugify }));

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

      expect(mocks.slugify).toHaveBeenCalledWith("New Cat", {
        lower: true,
        strict: true,
      });
      expect(mocks.prisma.category.findUnique).toHaveBeenCalledWith({
        where: { slug: "new-cat" },
      });
      expect(mocks.prisma.category.create).toHaveBeenCalledWith({
        data: {
          name: "New Cat",
          description: null,
          slug: "new-cat",
        },
      });
      expect(result).toEqual({ message: "Category created successfully" });
    });

    it("throws when category exists and active", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue({
        id: "c1",
        deletedAt: null,
      });

      await expect(createCategory({ name: "Existing" })).rejects.toThrow(
        "Category already exists",
      );
      expect(mocks.prisma.category.create).not.toHaveBeenCalled();
    });

    it("throws when category exists but deleted", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue({
        id: "c1",
        deletedAt: new Date(),
      });

      await expect(createCategory({ name: "Deleted" })).rejects.toThrow(
        "Category exists but is deleted. Restore it instead",
      );
      expect(mocks.prisma.category.create).not.toHaveBeenCalled();
    });

    it("trims name and generates slug correctly", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue(null);
      mocks.prisma.category.create.mockResolvedValue({});

      await createCategory({ name: "  New Cat  " });

      expect(mocks.prisma.category.create).toHaveBeenCalledWith({
        data: {
          name: "New Cat",
          description: null,
          slug: "new-cat",
        },
      });
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

    it("returns empty array when no active categories exist", async () => {
      mocks.prisma.category.findMany.mockResolvedValue([]);

      const result = await getAllCategories();

      expect(result).toEqual([]);
    });

    it("does not return deleted or inactive categories", async () => {
      const list = [{ id: "c1", isActive: true, deletedAt: null }];
      mocks.prisma.category.findMany.mockResolvedValue(list);

      await getAllCategories();

      expect(mocks.prisma.category.findMany).toHaveBeenCalledWith({
        where: { isActive: true, deletedAt: null },
        orderBy: { createdAt: "asc" },
      });
    });
  });

  describe("getCategoryBySlug", () => {
    it("returns category when found", async () => {
      const cat = { id: "c1", slug: "a" };
      mocks.prisma.category.findFirst.mockResolvedValue(cat);

      const result = await getCategoryBySlug("a");

      expect(mocks.prisma.category.findFirst).toHaveBeenCalledWith({
        where: { slug: "a", isActive: true, deletedAt: null },
      });
      expect(result).toBe(cat);
    });

    it("throws when not found", async () => {
      mocks.prisma.category.findFirst.mockResolvedValue(null);

      await expect(getCategoryBySlug("missing")).rejects.toThrow(
        "Category not found",
      );
    });
  });

  describe("updateCategory", () => {
    it("trims the id before querying", async () => {
      mocks.prisma.category.findUnique.mockResolvedValueOnce({
        id: "c1",
        deletedAt: null,
      });
      mocks.prisma.category.update.mockResolvedValue({});

      await updateCategory("  c1  ", { isActive: true });

      expect(mocks.prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: "c1" },
      });
      expect(mocks.prisma.category.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: { isActive: true },
      });
    });

    it("updates name and slug successfully", async () => {
      mocks.prisma.category.findUnique.mockResolvedValueOnce({
        id: "c1",
        deletedAt: null,
      });
      mocks.prisma.category.findUnique.mockResolvedValueOnce(null);
      mocks.prisma.category.update.mockResolvedValue({});

      const result = await updateCategory("c1", { name: "  New Name  " });

      expect(mocks.slugify).toHaveBeenCalledWith("New Name", {
        lower: true,
        strict: true,
      });
      expect(mocks.prisma.category.findUnique).toHaveBeenNthCalledWith(2, {
        where: { slug: "new-name" },
      });
      expect(mocks.prisma.category.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: { name: "New Name", slug: "new-name" },
      });
      expect(result).toEqual({ message: "Category updated successfully" });
    });

    it("allows updating name when slug belongs to same category", async () => {
      mocks.prisma.category.findUnique.mockResolvedValueOnce({
        id: "c1",
        deletedAt: null,
      });
      mocks.prisma.category.findUnique.mockResolvedValueOnce({ id: "c1" });
      mocks.prisma.category.update.mockResolvedValue({});

      const result = await updateCategory("c1", { name: "Same Name" });

      expect(mocks.prisma.category.update).toHaveBeenCalled();
      expect(result).toEqual({ message: "Category updated successfully" });
    });

    it("throws when category not found", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue(null);

      await expect(updateCategory("nope", { name: "x" })).rejects.toThrow(
        "Category not found",
      );
      expect(mocks.prisma.category.update).not.toHaveBeenCalled();
    });

    it("throws when category is deleted", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue({
        id: "c1",
        deletedAt: new Date(),
      });

      await expect(updateCategory("c1", { name: "x" })).rejects.toThrow(
        "Category not found",
      );
      expect(mocks.prisma.category.update).not.toHaveBeenCalled();
    });

    it("throws when new slug exists on another record", async () => {
      mocks.prisma.category.findUnique.mockResolvedValueOnce({
        id: "c1",
        deletedAt: null,
      });
      mocks.prisma.category.findUnique.mockResolvedValueOnce({ id: "c2" });

      await expect(updateCategory("c1", { name: "Other" })).rejects.toThrow(
        "Category already exists",
      );
      expect(mocks.prisma.category.update).not.toHaveBeenCalled();
    });

    it("updates description with trim", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue({
        id: "c1",
        deletedAt: null,
      });
      mocks.prisma.category.update.mockResolvedValue({});

      const result = await updateCategory("c1", {
        description: "  New desc  ",
      });

      expect(mocks.prisma.category.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: { description: "New desc" },
      });
      expect(result).toEqual({ message: "Category updated successfully" });
    });

    it("sets description to null when empty string", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue({
        id: "c1",
        deletedAt: null,
      });
      mocks.prisma.category.update.mockResolvedValue({});

      await updateCategory("c1", { description: "   " });

      expect(mocks.prisma.category.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: { description: null },
      });
    });

    it("updates isActive successfully", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue({
        id: "c1",
        deletedAt: null,
      });
      mocks.prisma.category.update.mockResolvedValue({});

      await updateCategory("c1", { isActive: false });

      expect(mocks.prisma.category.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: { isActive: false },
      });
    });
  });

  describe("softDeleteCategory", () => {
    it("trims the id before querying", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue({
        id: "c1",
        deletedAt: null,
      });
      mocks.prisma.category.update.mockResolvedValue({});

      await softDeleteCategory("  c1  ");

      expect(mocks.prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: "c1" },
      });
      expect(mocks.prisma.category.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: { isActive: false, deletedAt: expect.any(Date) },
      });
    });

    it("soft deletes an existing category", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue({
        id: "c1",
        deletedAt: null,
      });
      mocks.prisma.category.update.mockResolvedValue({});

      const result = await softDeleteCategory("c1");

      expect(mocks.prisma.category.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: { isActive: false, deletedAt: expect.any(Date) },
      });
      expect(result).toEqual({ message: "Category deleted successfully" });
    });

    it("throws when category not found", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue(null);

      await expect(softDeleteCategory("c1")).rejects.toThrow(
        "Category not found",
      );
      expect(mocks.prisma.category.update).not.toHaveBeenCalled();
    });

    it("throws when category is already deleted", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue({
        id: "c1",
        deletedAt: new Date(),
      });

      await expect(softDeleteCategory("c1")).rejects.toThrow(
        "Category not found",
      );
      expect(mocks.prisma.category.update).not.toHaveBeenCalled();
    });
  });

  describe("restoreCategory", () => {
    it("trims the id before querying", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue({
        id: "c1",
        deletedAt: new Date(),
      });
      mocks.prisma.category.update.mockResolvedValue({});

      await restoreCategory("  c1  ");

      expect(mocks.prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: "c1" },
      });
      expect(mocks.prisma.category.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: { isActive: true, deletedAt: null },
      });
    });

    it("restores a deleted category successfully", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue({
        id: "c1",
        deletedAt: new Date(),
      });
      mocks.prisma.category.update.mockResolvedValue({});

      const result = await restoreCategory("c1");

      expect(mocks.prisma.category.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: { isActive: true, deletedAt: null },
      });
      expect(result).toEqual({ message: "Category restored successfully" });
    });

    it("throws when category not found", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue(null);

      await expect(restoreCategory("c1")).rejects.toThrow("Category not found");
      expect(mocks.prisma.category.update).not.toHaveBeenCalled();
    });

    it("throws when category is not deleted", async () => {
      mocks.prisma.category.findUnique.mockResolvedValue({
        id: "c1",
        deletedAt: null,
      });

      await expect(restoreCategory("c1")).rejects.toThrow("Category not found");
      expect(mocks.prisma.category.update).not.toHaveBeenCalled();
    });
  });
});
