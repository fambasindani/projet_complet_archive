/**
 * Service Déclarations (AD) + Documents OCR
 */
import api from './api';
import type { Declaration, DocumentDeclaration, PaginatedData, DeclarationFilters, DocumentSearchFilters } from '../types';

export const declarationService = {
  // Liste paginée filtrée par direction_ids (multi-tenant)
  list(params: DeclarationFilters = {}) {
    return api.get<{ success: boolean; data: PaginatedData<Declaration> }>('/declarations', { params })
  },

  search(params: { search: string; page?: number; direction_ids?: string }) {
    return api.post<{ data: PaginatedData<Declaration>; [k: string]: unknown }>('/declarations/search', params);
  },

  getById(id: number) {
    return api.get<Declaration>(`/editdeclaration/${id}`);
  },

  // id_user est forcé côté backend depuis le token
  create(payload: Omit<Declaration, 'id' | 'statut' | 'created_at' | 'updated_at' | 'departement' | 'emplacement' | 'classeur' | 'utilisateur'>) {
    return api.post<{ success: boolean; declaration: Declaration; id: number }>('/declarations', payload);
  },

  update(id: number, payload: Partial<Declaration>) {
    return api.put<Declaration>(`/declarations/${id}`, payload);
  },

  remove(id: number) {
    return api.delete(`/declarations/${id}`);
  },

  // Par classeur + directions
  listByClasseur(classeurId: number, params: { direction_ids?: string } = {}) {
    return api.get<PaginatedData<Declaration>>(`/listedeclaration/${classeurId}`, { params })
  },

  listByClasseurAndDirection(classeurId: number, directionId: number) {
    return api.post<PaginatedData<Declaration>>(`/listedeclaration/${classeurId}`, { id_direction: directionId })
  },
};

export const documentDeclarationService = {
  getByDeclaration(declarationId: number) {
    return api.get<DocumentDeclaration[]>(`/documents/${declarationId}`);
  },

  uploadMultiple(formData: FormData) {
    return api
      .post<{ success: boolean; documents: DocumentDeclaration[]; message: string }>('/documents-declaration/upload-multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      
  },

  // helper pour construire FormData
  uploadFiles(declarationId: number, classeurId: number, files: File[]) {
    const fd = new FormData();
    fd.append('id_declaration', String(declarationId));
    fd.append('id_classeur', String(classeurId));
    files.forEach((f) => fd.append('files[]', f));
    return this.uploadMultiple(fd);
  },

  download(id: number) {
    // téléchargement via window.open côté UI, mais on expose l'URL
    return `${api.defaults.baseURL}/documents-declaration/download/${id}`;
  },

  getText(id: number) {
    return api.get<{ success: boolean; montext: string | null; nom: string }>(`/documents-declaration/${id}/text`)
   // ((r) => r.data);
  },

  updateText(id: number, montext: string) {
    return api.put<{ success: boolean; message: string }>(`/documents-declaration/${id}/update-text`, { montext })
      //(r) => r.data);
  },

  advancedSearch(directionId: number, filters: DocumentSearchFilters) {
    return api
      .post<{
        success: boolean;
        data: DocumentDeclaration[];
        pagination: { current_page: number; last_page: number; per_page: number; total: number };
      }>(`/documents-declaration/advanced-search/${directionId}`, filters)
      
  },

  ocrStats(params: { id_declaration?: number } = {}) {
    return api.get<{ success: boolean; data: { total_documents: number; documents_avec_texte: number } }>('/documents-declaration/ocr-stats', { params })
  },

  deleteDocument(id: number) {
    return api.delete(`/delete-document/${id}`)
  },
};

export default declarationService;
