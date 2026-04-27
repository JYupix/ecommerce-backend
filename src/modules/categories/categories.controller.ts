import { Request, Response } from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryBySlug,
  restoreCategory,
  softDeleteCategory,
  updateCategory,
} from "./categories.service.js";
import { createCategorySchema, updateCategorySchema } from "./categories.schema.js";

const conflictMessages = new Set([
  "Category already exists",
  "Category exists but is deleted. Restore it instead",
]);

const isNotFoundError = (error: Error): boolean => {
  return error.message === "Category not found";
};

const getParamAsString = (value: string | string[] | undefined): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
};

export const createCategoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const parsedData = createCategorySchema.parse(req.body);
    const result = await createCategory(parsedData);

    return res.status(201).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (conflictMessages.has(error.message)) {
        return res.status(409).json({ error: error.message });
      }

      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllCategoriesController = async (_req: Request, res: Response) => {
  try {
    const result = await getAllCategories();
    return res.status(200).json(result);
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getCategoryBySlugController = async (req: Request, res: Response) => {
  try {
    const slug = getParamAsString(req.params.slug);

    if (!slug) {
      return res.status(400).json({ error: "Slug is required" });
    }

    const result = await getCategoryBySlug(slug);
    return res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (isNotFoundError(error)) {
        return res.status(404).json({ error: error.message });
      }

      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateCategoryController = async (req: Request, res: Response) => {
  try {
    const id = getParamAsString(req.params.id);

    if (!id) {
      return res.status(400).json({ error: "Category id is required" });
    }

    const parsedData = updateCategorySchema.parse(req.body);
    const result = await updateCategory(id, parsedData);

    return res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (isNotFoundError(error)) {
        return res.status(404).json({ error: error.message });
      }

      if (conflictMessages.has(error.message)) {
        return res.status(409).json({ error: error.message });
      }

      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

export const softDeleteCategoryController = async (req: Request, res: Response) => {
  try {
    const id = getParamAsString(req.params.id);

    if (!id) {
      return res.status(400).json({ error: "Category id is required" });
    }

    const result = await softDeleteCategory(id);
    return res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (isNotFoundError(error)) {
        return res.status(404).json({ error: error.message });
      }

      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

export const restoreCategoryController = async (req: Request, res: Response) => {
  try {
    const id = getParamAsString(req.params.id);

    if (!id) {
      return res.status(400).json({ error: "Category id is required" });
    }

    const result = await restoreCategory(id);
    return res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (isNotFoundError(error)) {
        return res.status(404).json({ error: error.message });
      }

      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};