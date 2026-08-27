/**
 * Service Auth - login / logout / profil
 * Remplace le `axios` inline de LoginScreen.js + getTokenOrRedirect.js
 */
import api from './api';
import type { LoginPayload, LoginResponseData, MonUtilisateur } from '../types';

const AUTH_KEYS = {
  token: 'token',
  user: 'utilisateur',
  roles: 'role',
  permissions: 'permissions',
  departements: 'departements',
  archive_module: 'archive_module',
} as const;

export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await api.post<{ success: boolean; data: LoginResponseData; message: string }>('/connexion', payload);
    if (data.success && data.data) {
      const d = data.data;
      localStorage.setItem(AUTH_KEYS.token, d.token);
      localStorage.setItem(AUTH_KEYS.user, JSON.stringify(d.user));
      localStorage.setItem(AUTH_KEYS.roles, JSON.stringify(d.roles));
      localStorage.setItem(AUTH_KEYS.permissions, JSON.stringify(d.permissions.codes));
      localStorage.setItem(AUTH_KEYS.departements, JSON.stringify(d.departements));
      // compat : Frontend legacy lit `permissions` comme codes, `role` comme roles
      localStorage.setItem('permissionlist', JSON.stringify(d.permissions.details));
    }
    return data;
  },

  async logout() {
    try {
      await api.post('/logout');
    } catch {
      // ignore - token peut être expiré
    } finally {
      Object.values(AUTH_KEYS).forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem('permissionlist');
      localStorage.removeItem('user_stats');
      localStorage.removeItem('rememberMe');
    }
  },

  async me(): Promise<MonUtilisateur> {
    const { data } = await api.get<{ success: boolean; data: MonUtilisateur }>('/profil/mon-profil');
    // backend renvoie { success, data: { id, nom, ... } }
    // mais monProfil renvoie data imbriqué, on normalize
    return (data as any).data ?? data;
  },

  getToken(): string | null {
    return localStorage.getItem(AUTH_KEYS.token);
  },

  getUser(): MonUtilisateur | null {
    const raw = localStorage.getItem(AUTH_KEYS.user);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as MonUtilisateur;
    } catch {
      return null;
    }
  },

  getPermissions(): string[] {
    const raw = localStorage.getItem(AUTH_KEYS.permissions);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  },

  hasPermission(code: string): boolean {
    return this.getPermissions().includes(code);
  },

  getDepartements(): import('../types').Departement[] {
    const raw = localStorage.getItem(AUTH_KEYS.departements);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

export default authService;
