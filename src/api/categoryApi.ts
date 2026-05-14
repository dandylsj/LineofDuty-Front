import { api } from './client';

export interface CategoryResponse {
  id: number;
  name: string;
  description: string;
  parentId: number | null;
  children: CategoryResponse[];
}

export interface CategoryRequest {
  name: string;
  description: string;
  parentId?: number | null;
}

export const categoryApi = {
  getCategories: () => api.get<{ data: CategoryResponse[] }>('/categories'),
  createCategory: (data: CategoryRequest) => api.post('/categories', data),
  deleteCategory: (id: number) => api.delete(`/categories/${id}`),
};
