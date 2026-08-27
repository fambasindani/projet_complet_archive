import api from './api';
import type { ArticleBudgetaire, PaginatedData, CreateArticlePayload } from '../types';

export const articleService = {
  list(params: { page?: number; per_page?: number } = {}) {
    return api.get<PaginatedData<ArticleBudgetaire>>('/article', { params }).then(r => r.data);
  },
  listAll() {
    return api.get<ArticleBudgetaire[]>('/articleall').then(r => r.data as any);
  },
  search(payload: { search: string }) {
    return api.post('/search-article', payload).then(r => r.data);
  },
  getById(id: number) {
    return api.get<ArticleBudgetaire>(`/edit-article/${id}`).then(r => r.data);
  },
  create(payload: CreateArticlePayload) {
    return api.post('/create-article', payload).then(r => r.data);
  },
  update(id: number, payload: Partial<CreateArticlePayload>) {
    return api.put(`/update-article/${id}`, payload).then(r => r.data);
  },
  remove(id: number) {
    return api.delete(`/delete-article/${id}`).then(r => r.data);
  },
};

export default articleService;
