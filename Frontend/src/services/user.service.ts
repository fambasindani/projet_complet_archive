import api from './api';
import type { MonUtilisateur, PaginatedData, CreateMonUtilisateurPayload, UpdateMonUtilisateurPayload } from '../types';

export const userService = {
  list(params: { search?: string; statut?: string; per_page?: number; page?: number } = {}) {
    return api.get<{ success: boolean; data: PaginatedData<MonUtilisateur> }>('/mon-utilisateurs', { params }).then(r => r.data);
  },
  getById(id: number) {
    return api.get<{ success: boolean; data: MonUtilisateur }>(`/mon-utilisateurs/${id}`).then(r => r.data);
  },
  getWithDetails(id: number) {
    return api.get<{ success: boolean; data: MonUtilisateur }>(`/mon-utilisateurs/${id}/with-details`).then(r => r.data);
  },
  create(payload: CreateMonUtilisateurPayload) {
    return api.post<{ success: boolean; data: MonUtilisateur }>('/mon-utilisateurs', payload).then(r => r.data);
  },
  update(id: number, payload: UpdateMonUtilisateurPayload) {
    return api.put<{ success: boolean; data: MonUtilisateur }>(`/mon-utilisateurs/${id}`, payload).then(r => r.data);
  },
  remove(id: number) {
    return api.delete(`/mon-utilisateurs/${id}`).then(r => r.data);
  },
  stats() {
    return api.get('/mon-utilisateurs/stats/general').then(r => r.data);
  },
  recent() {
    return api.get('/mon-utilisateurs/stats/recent').then(r => r.data);
  },
  dashboardStats() {
    return api.get('/dashboard/statistique').then(r => r.data);
  },
  assignRoles(id: number, role_ids: number[]) {
    return api.post(`/mon-utilisateurs/${id}/assign-roles`, { role_ids }).then(r => r.data);
  },
  removeRole(userId: number, roleId: number) {
    return api.post(`/mon-utilisateurs/${userId}/remove-role/${roleId}`).then(r => r.data);
  },
  assignDirections(id: number, direction_ids: number[]) {
    return api.post(`/mon-utilisateurs/${id}/assign-directions`, { direction_ids }).then(r => r.data);
  },
  removeDirection(userId: number, departementId: number) {
    return api.post(`/mon-utilisateurs/${userId}/remove-direction/${departementId}`).then(r => r.data);
  },
};

export default userService;
