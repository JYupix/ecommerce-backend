export interface CreateCategoryInput {
  name: string;
  description?: string | undefined;
}

export interface UpdateCategoryInput {
  name?: string | undefined;
  description?: string | undefined;
  isActive?: boolean | undefined;
}

export interface CategoryResponse {
  message: string;
}
