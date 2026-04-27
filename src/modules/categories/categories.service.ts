import { prisma } from "../../config/db.js";
import slugify from "slugify";
import {
  CategoryResponse,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./categories.types.js";

export const createCategory = async (
  data: CreateCategoryInput,
): Promise<CategoryResponse> => {
  const name = data.name.trim();
  const description = data.description?.trim() || null;
  const slug = slugify(name, { lower: true, strict: true });

  const existingCategory = await prisma.category.findUnique({
    where: { slug },
  });

  if (existingCategory) {
    if (existingCategory.deletedAt) {
      throw new Error("Category exists but is deleted. Restore it instead");
    }

    throw new Error("Category already exists");
  }

  await prisma.category.create({
    data: {
      name,
      description,
      slug,
    },
  });

  return { message: "Category created successfully" };
};

export const getAllCategories = async () => {
  return await prisma.category.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
  });
};

export const getCategoryBySlug = async (slug: string) => {
  const category = await prisma.category.findFirst({
    where: {
      slug,
      isActive: true,
      deletedAt: null,
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  return category;
};

export const updateCategory = async (id: string, data: UpdateCategoryInput) => {
  const normalizedId = id.trim();

  const existingCategory = await prisma.category.findUnique({
    where: { id: normalizedId },
  });

  if (!existingCategory || existingCategory.deletedAt) {
    throw new Error("Category not found");
  }

  const updateData: {
    name?: string;
    slug?: string;
    description?: string | null;
    isActive?: boolean;
  } = {};

  if (data.name) {
    const nextName = data.name.trim();
    const nextSlug = slugify(nextName, { lower: true, strict: true });

    const existingBySlug = await prisma.category.findUnique({
      where: { slug: nextSlug },
    });

    if (existingBySlug && existingBySlug.id !== existingCategory.id) {
      throw new Error("Category already exists");
    }

    updateData.name = nextName;
    updateData.slug = nextSlug;
  }

  if (typeof data.description === "string") {
    updateData.description = data.description.trim() || null;
  }

  if (typeof data.isActive === "boolean") {
    updateData.isActive = data.isActive;
  }

  await prisma.category.update({
    where: { id: normalizedId },
    data: updateData,
  });

  return { message: "Category updated successfully" };
};

export const softDeleteCategory = async (id: string): Promise<CategoryResponse> => {
  const normalizedId = id.trim();

  const existingCategory = await prisma.category.findUnique({
    where: { id: normalizedId },
  });

  if (!existingCategory || existingCategory.deletedAt) {
    throw new Error("Category not found");
  }

  await prisma.category.update({
    where: { id: normalizedId },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });

  return { message: "Category deleted successfully" };
};

export const restoreCategory = async (id: string): Promise<CategoryResponse> => {
  const normalizedId = id.trim();

  const existingCategory = await prisma.category.findUnique({
    where: { id: normalizedId },
  });

  if (!existingCategory || !existingCategory.deletedAt) {
    throw new Error("Category not found");
  }

  await prisma.category.update({
    where: { id: normalizedId },
    data: {
      isActive: true,
      deletedAt: null,
    },
  });

  return { message: "Category restored successfully" };
};

