import api from './api';

export const publicService = {
  stats() {
    return api.get('/public/stats').then(r => r.data);
  },
  adStats() {
    return api.get('/public/module/ad/stats').then(r => r.data);
  },
  npStats() {
    return api.get('/public/module/np/stats').then(r => r.data);
  },
  modules() {
    return api.get('/public/modules').then(r => r.data);
  },
  recentActivity() {
    return api.get('/public/recent-activity').then(r => r.data);
  },
  health() {
    return api.get('/public/health').then(r => r.data);
  },
  ping() {
    return api.get('/ping').then(r => r.data);
  },
};

export default publicService;
