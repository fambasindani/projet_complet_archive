import api from './api';

export interface ScanFileInfo {
  name: string;
  original_name?: string;
  size: string;
  size_mb?: number;
  pages?: number;
  url?: string;
  path?: string;
}

export const scanService = {
  upload(file: File, meta: { scan_date?: string; scanner_source?: string } = {}) {
    const fd = new FormData();
    fd.append('scan_file', file);
    if (meta.scan_date) fd.append('scan_date', meta.scan_date);
    if (meta.scanner_source) fd.append('scanner_source', meta.scanner_source);
    return api.post('/scans/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
  uploadMultiple(files: File[], id_classeur?: number) {
    const fd = new FormData();
    files.forEach(f => fd.append('files[]', f));
    if (id_classeur) fd.append('id_classeur', String(id_classeur));
    return api.post('/scans/upload-multiple', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
  list() {
    return api.get('/scans/list').then(r => r.data);
  },
  listAll() {
    return api.get('/scans').then(r => r.data);
  },
  search(q: string) {
    return api.get('/scans/search', { params: { q } }).then(r => r.data);
  },
  downloadUrl(filename: string) {
    return `${api.defaults.baseURL}/scans/download/${encodeURIComponent(filename)}`;
  },
  remove(filename: string) {
    return api.delete(`/scans/delete/${encodeURIComponent(filename)}`).then(r => r.data);
  },
  cleanup(days = 30) {
    return api.post('/scans/cleanup', { days }).then(r => r.data);
  },
  health() {
    return api.get('/scans/health').then(r => r.data);
  },
};

export default scanService;
