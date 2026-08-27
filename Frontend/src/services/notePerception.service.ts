/**
 * Service Notes de Perception (NP)
 * Pour Assujetti/Centre, utiliser assujetti.service.ts / centre.service.ts
 */
import api from './api';
import type { NotePerception, PaginatedData, NoteSearchFilters } from '../types';

export const notePerceptionService = {
  list(params: { page?: number; per_page?: number } = {}) {
    return api.get<PaginatedData<NotePerception>>('/notes', { params }).then((r) => r.data);
  },
  listByCentre(centreId: number, params: { page?: number } = {}) {
    return api.get<PaginatedData<NotePerception>>(`/note-centre/${centreId}`, { params }).then((r) => r.data);
  },
  search(params: { search: string; page?: number }) {
    return api.post<PaginatedData<NotePerception>>('/notes/search', params).then((r) => r.data);
  },
  getById(id: number) {
    return api.get<NotePerception>(`/notes/${id}`).then((r) => r.data);
  },
  create(payload: Omit<NotePerception, 'id' | 'statut' | 'created_at' | 'updated_at' | 'classeur' | 'centre' | 'assujetti' | 'emplacement' | 'utilisateur'>) {
    return api.post<{ message: string; data: NotePerception }>('/notes', payload).then((r) => r.data);
  },
  update(id: number, payload: Partial<NotePerception>) {
    return api.put<{ message: string; data: NotePerception }>(`/notes/${id}`, payload).then((r) => r.data);
  },
  remove(id: number) {
    return api.delete(`/notes/${id}`).then((r) => r.data);
  },
  advancedSearch(filters: NoteSearchFilters) {
    return api
      .post<{
        success: boolean;
        data: unknown[];
        pagination: { current_page: number; last_page: number; per_page: number; total: number };
      }>('/notes-perception/advanced-search', filters)
      .then((r) => r.data);
  },
};

export default notePerceptionService;
