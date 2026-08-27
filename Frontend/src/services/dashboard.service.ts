/**
 * Service Dashboards (AD + NP) + Public stats
 */
import api from './api';

export const dashboardService = {
  // Dashboard AD
  statistics() {
    return api.get('/dashboard/statistics');
  },
  classifiers() {
    return api.get('/dashboard/classifiers');
  },
  recent() {
    return api.get('/dashboard/recent'); 
  },
  advancedSearch(payload: unknown) {
    return api.post('/dashboard/search', payload);
  },

  // Dashboard NP
  noteStatistics() {
    return api.get('/dashboards/notes/statistics');
  },

  // Public (sans auth)
  publicStats() {
    return api.get('/public/stats');
  },
  publicAdStats() {
    return api.get('/public/module/ad/stats');
  },
  publicNpStats() {
    return api.get('/public/module/np/stats');
  },
};

export default dashboardService;
