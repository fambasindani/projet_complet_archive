import api from './api';
import type { MonUtilisateur } from '../types';

export const profilService = {
  me() {
    return api.get<{ success: boolean; data: MonUtilisateur }>('/profil/mon-profil').then(r => r.data);
  },
  getById(id: number) {
    return api.get(`/profil/utilisateurs/${id}`).then(r => r.data);
  },
  show(id: number) {
    return api.get(`/profil/afficher/${id}`).then(r => r.data);
  },
  update(id: number, payload: FormData | { nom?: string; prenom?: string; email?: string; password?: string; current_password?: string }) {
    const isForm = payload instanceof FormData;
    return api.put(`/profil/modifier/${id}`, payload, isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined).then(r => r.data);
  },
  avatarUrl(filename: string) {
    return `${api.defaults.baseURL}/profil/avatar/${encodeURIComponent(filename)}`;
  },
};

export default profilService;
