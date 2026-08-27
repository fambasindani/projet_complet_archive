import api from './api';
import type { Permission, PaginatedData, CreatePermissionPayload } from '../types';

export const permissionService = {
  list(params: { search?: string; per_page?: number; page?: number } = {}) {
    return api.get<PaginatedData<Permission> | Permission[]>('/permissions', { params }).then(r => r.data as any);
  },
  getById(id: number) {
    return api.get<Permission | { success: boolean; data: Permission }>(`/permissions/${id}`).then(r => r.data);
  },
  usedBy(id: number) {
    return api.get(`/permissions/${id}/used-by`).then(r => r.data);
  },
  create(payload: CreatePermissionPayload) {
    return api.post('/permissions', payload).then(r => r.data);
  },
  update(id: number, payload: Partial<CreatePermissionPayload>) {
    return api.put(`/permissions/${id}`, payload).then(r => r.data);
  },
  remove(id: number) {
    return api.delete(`/permissions/${id}`).then(r => r.data);
  },
};

export default permissionService;
