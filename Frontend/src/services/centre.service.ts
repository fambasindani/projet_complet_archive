import api from './api';
import type { CentreOrdonnancement, PaginatedData, CreateCentrePayload } from '../types';

export const centreService = {
  listAll() {
    return api.get('/centre_ordonnancements/all').then(r => r.data as any);
  },
  list(params: { page?: number; per_page?: number } = {}) {
    return api.get('/centre').then(r => r.data as any);
  },
  search(payload: { search: string }) {
    return api.post('/centre_ordonnancements/search', payload).then(r => r.data);
  },
  getById(id: number) {
    return api.get(`/centre_ordonnancements/${id}`).then(r => r.data);
  },
  create(payload: CreateCentrePayload) {
    return api.post('/centre_ordonnancements', payload).then(r => r.data);
  },
  update(id: number, payload: Partial<CreateCentrePayload>) {
    return api.put(`/centre_ordonnancements/${id}`, payload).then(r => r.data);
  },
  remove(id: number) {
    return api.delete(`/centre_ordonnancements/${id}`).then(r => r.data);
  },
};

export default centreService;
