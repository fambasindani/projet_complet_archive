// @ts-nocheck
import axios from 'axios';
import { API_BASE_URL } from "../config";

class DocumentService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async updateDocumentText(documentId, text, token) {
    try {
      const response = await axios.put(
        `${this.baseURL}/documents-declaration/${documentId}/update-text`,
        { montext: text },
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async getDocumentText(documentId, token) {
    try {
      const response = await axios.get(
        `${this.baseURL}/documents-declaration/${documentId}/text`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      return { success: true, text: response.data.montext };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }
}

export default new DocumentService();
