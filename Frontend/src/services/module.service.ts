import api from './api';

export const moduleService = {
  list() {
    return api.get('/modules').then(r => r.data);
  },
  search(params: { search: string }) {
    return api.get('/modules/search', { params }).then(r => r.data);
  },
  getById(id: number) {
    return api.get(`/modules/${id}`).then(r => r.data);
  },
  create(payload: any) {
    return api.post('/modules', payload).then(r => r.data);
  },
  update(id: number, payload: any) {
    return api.put(`/modules/${id}`, payload).then(r => r.data);
  },
  remove(id: number) {
    return api.delete(`/modules/${id}`).then(r => r.data);
  },
};

export default moduleService;
