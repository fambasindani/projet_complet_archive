/**
 * @deprecated Legacy — utiliser departement.service.ts
 * Routes /directions et /direction (backend DirectionController) — conservé pour compat
 */
import api from './api';
import type { Direction } from '../types';

export const directionService = {
  list() {
    return api.get<Direction[]>('/direction').then(r => r.data as any);
  },
  create(payload: { nom: string; statut?: number }) {
    return api.post('/directions', payload).then(r => r.data);
  },
  update(id: number, payload: { nom: string; statut?: number }) {
    return api.put(`/directions/${id}`, payload).then(r => r.data);
  },
  remove(id: number) {
    return api.delete(`/directions/${id}`).then(r => r.data);
  },
};

export default directionService;
