import type { MonUtilisateur, Role, Departement, Permission } from './models';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  user: MonUtilisateur;
  roles: Role[];
  permissions: {
    codes: string[];
    details: Permission[];
  };
  departements: Departement[];
  token: string;
  token_type: 'Bearer';
  stats: {
    roles_count: number;
    permissions_count: number;
    departements_count: number;
  };
}

export interface AuthState {
  user: MonUtilisateur | null;
  token: string | null;
  roles: Role[];
  permissions: string[]; // codes
  departements: Departement[];
  isAuthenticated: boolean;
}

export interface DecodedTokenPayload {
  // Sanctum personal_access_token abilities = permissions codes
  abilities: string[];
}
