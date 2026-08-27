import api from './api';
import type { Departement, PaginatedData, CreateDepartementPayload } from '../types';

export const departementService = {
  list(params: { search?: string; per_page?: number; page?: number } = {}) {
    return api.get<PaginatedData<Departement> | Departement[]>('/departements', { params }).then(r => r.data as any);
  },
  getById(id: number) {
    return api.get<Departement | { success: boolean; data: Departement }>(`/departements/${id}`).then(r => r.data);
  },
  getWithDetails(id: number) {
    return api.get(`/departements/${id}/with-details`).then(r => r.data);
  },
  availableUsers(id: number) {
    return api.get(`/departements/${id}/available-users`).then(r => r.data);
  },
  stats() {
    return api.get('/departements/stats/departement').then(r => r.data);
  },
  create(payload: CreateDepartementPayload) {
    return api.post('/departements', payload).then(r => r.data);
  },
  update(id: number, payload: Partial<CreateDepartementPayload>) {
    return api.put(`/departements/${id}`, payload).then(r => r.data);
  },
  remove(id: number) {
    return api.delete(`/departements/${id}`).then(r => r.data);
  },
  assignUser(departementId: number, userId: number) {
    return api.post(`/departements/${departementId}/assign-user/${userId}`).then(r => r.data);
  },
  removeUser(departementId: number, userId: number) {
    return api.post(`/departements/${departementId}/remove-user/${userId}`).then(r => r.data);
  },
};

export default departementService;
