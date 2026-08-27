import api from './api';
import type { Emplacement, PaginatedData, CreateEmplacementPayload } from '../types';

export const emplacementService = {
  list(params: { page?: number; per_page?: number } = {}) {
    return api.get<PaginatedData<Emplacement>>('/emplacements', { params }).then(r => r.data);
  },
  listAll() {
    return api.get<Emplacement[]>('/emplacement').then(r => r.data as any);
  },
  search(params: { search: string; page?: number }) {
    return api.get<PaginatedData<Emplacement>>('/emplacements/search', { params }).then(r => r.data);
  },
  getById(id: number) {
    return api.get<Emplacement>(`/emplacements/${id}`).then(r => r.data);
  },
  create(payload: CreateEmplacementPayload) {
    return api.post('/emplacements', payload).then(r => r.data);
  },
  update(id: number, payload: Partial<CreateEmplacementPayload>) {
    return api.put(`/emplacements/${id}`, payload).then(r => r.data);
  },
  remove(id: number) {
    return api.delete(`/emplacements/${id}`).then(r => r.data);
  },
};

export default emplacementService;
