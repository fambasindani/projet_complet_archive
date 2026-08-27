// @ts-nocheck
// src/services/documentService.js
import axios from 'axios';
import { API_BASE_URL } from "../config";


class DocumentService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Sauvegarder un document avec son texte OCR
  async saveDocument(data) {
    try {
      const response = await axios.post(
        `${this.baseURL}/documents-declaration/save-ocr`,
        {
          id_declaration: data.id_declaration,
          id_classeur: data.id_classeur,
          nom_fichier: data.nom_fichier,
          nom_native: data.nom_native,
          taille: data.taille,
          montext: data.montext, // ← Le texte OCR
          nb_pages: data.nb_pages,
          statut: data.statut || 'traité',
          confiance_moyenne: data.confiance_moyenne || 0
        },
        {
          headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Mettre à jour le texte OCR d'un document existant
  async updateDocumentText(documentId, text, token) {
    try {
      const response = await axios.put(
        `${this.baseURL}/documents-declaration/${documentId}/update-text`,
        { montext: text },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Récupérer le texte OCR d'un document
  async getDocumentText(documentId, token) {
    try {
      const response = await axios.get(
        `${this.baseURL}/documents-declaration/${documentId}/text`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        text: response.data.montext
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

export default new DocumentService();