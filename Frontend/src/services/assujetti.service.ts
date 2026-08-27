import api from './api';
import type { Assujetti, PaginatedData, CreateAssujettiPayload } from '../types';

export const assujettiService = {
  list(params: { page?: number; per_page?: number; search?: string } = {}) {
    return api.get<PaginatedData<Assujetti> | Assujetti[]>('/assujettis', { params }).then(r => r.data as any);
  },
  search(params: { search: string }) {
    return api.get('/assujettis/search', { params }).then(r => r.data);
  },
  getById(id: number) {
    return api.get<Assujetti>(`/assujettis/${id}`).then(r => r.data);
  },
  create(payload: CreateAssujettiPayload) {
    return api.post('/assujettis', payload).then(r => r.data);
  },
  update(id: number, payload: Partial<CreateAssujettiPayload>) {
    return api.put(`/assujettis/${id}`, payload).then(r => r.data);
  },
  remove(id: number) {
    return api.delete(`/assujettis/${id}`).then(r => r.data);
  },
};

export default assujettiService;
