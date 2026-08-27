import api from './api';
import type { Role, PaginatedData, CreateRolePayload } from '../types';

export const roleService = {
  list(params: { search?: string; per_page?: number; page?: number } = {}) {
    return api.get<PaginatedData<Role> | Role[]>('/roles', { params }).then(r => r.data as any);
  },
  getById(id: number) {
    return api.get<Role | { success: boolean; data: Role }>(`/roles/${id}`).then(r => r.data);
  },
  getWithDetails(id: number) {
    return api.get(`/roles/${id}/with-details`).then(r => r.data);
  },
  stats() {
    return api.get('/roles/stats').then(r => r.data);
  },
  create(payload: CreateRolePayload) {
    return api.post('/roles', payload).then(r => r.data);
  },
  update(id: number, payload: Partial<CreateRolePayload>) {
    return api.put(`/roles/${id}`, payload).then(r => r.data);
  },
  remove(id: number) {
    return api.delete(`/roles/${id}`).then(r => r.data);
  },
  assignPermissions(id: number, permission_ids: number[]) {
    return api.post(`/roles/${id}/assign-permissions`, { permission_ids }).then(r => r.data);
  },
  removePermission(roleId: number, permissionId: number) {
    return api.post(`/roles/${roleId}/remove-permission/${permissionId}`).then(r => r.data);
  },
};

export default roleService;
