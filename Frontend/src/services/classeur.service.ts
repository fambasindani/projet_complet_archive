import api from './api';
import type { Classeur, PaginatedData, CreateClasseurPayload } from '../types';

export const classeurService = {
  list(params: { page?: number; per_page?: number } = {}) {
    return api.get<PaginatedData<Classeur>>('/classeurs', { params }).then(r => r.data);
  },
  listAll() {
    return api.get<Classeur[]>('/classeur').then(r => r.data as any);
  },
  search(params: { search: string; page?: number }) {
    return api.get<PaginatedData<Classeur>>('/classeurs/search', { params }).then(r => r.data);
  },
  getById(id: number) {
    return api.get<Classeur>(`/classeurs/${id}`).then(r => r.data);
  },
  create(payload: CreateClasseurPayload) {
    return api.post('/classeurs', payload).then(r => r.data);
  },
  update(id: number, payload: Partial<CreateClasseurPayload>) {
    return api.put(`/classeurs/${id}`, payload).then(r => r.data);
  },
  remove(id: number) {
    return api.delete(`/classeurs/${id}`).then(r => r.data);
  },
};

export default classeurService;
