/**
 * Types génériques pour les réponses API backend
 */

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginatedData<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

// Laravel paginate peut être enveloppé dans { success, data: PaginatedData }
export type PaginatedResponse<T> = ApiSuccess<PaginatedData<T>> & {
  filtered_by?: unknown;
};

export interface PaginationParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface DeclarationFilters extends PaginationParams {
  direction_ids?: string | number[]; // "1,2" ou [1,2]
  id_classeur?: number;
  id_direction?: number;
}

export interface DocumentSearchFilters extends PaginationParams {
  query?: string;
  id_declaration?: number;
  id_classeur?: number;
  id_direction?: number;
  direction_ids?: string | number[];
  date_debut?: string;
  date_fin?: string;
}

export interface NoteSearchFilters extends PaginationParams {
  query?: string;
  id_classeur?: number;
  id_assujetti?: number;
  numero_article?: string;
  date_debut?: string;
  date_fin?: string;
}
