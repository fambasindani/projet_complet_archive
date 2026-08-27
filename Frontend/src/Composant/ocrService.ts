// @ts-nocheck
// src/Composant/ocrService.js
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.entry';
import Tesseract from 'tesseract.js';

class OCRService {

  constructor() {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
    console.log("✅ Worker PDF.js configuré localement");
    this.tesseractWorker = null;
  }

  async initTesseract() {
    if (!this.tesseractWorker) {
      console.log("🔄 Initialisation de Tesseract...");
      this.tesseractWorker = await Tesseract.createWorker('fra+eng');
      console.log("✅ Tesseract initialisé");
    }
    return this.tesseractWorker;
  }

  async extractTextFromPDF(file) {
    console.log("🔍 OCR Service - Début extraction pour:", file.name);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const totalPages = pdf.numPages;
      console.log(`📄 PDF chargé: ${totalPages} pages`);
      
      let fullText = '';
      let pagesAvecTexte = 0;
      let hasNativeText = false;

      // Étape 1: Essayer d'extraire le texte natif
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (pageText) {
          hasNativeText = true;
          pagesAvecTexte++;
          fullText += `--- PAGE ${pageNum} ---\n${pageText}\n\n`;
          console.log(`✅ Page ${pageNum}: ${pageText.length} caractères (texte natif)`);
        }
      }

      // Si pas de texte natif, utiliser Tesseract OCR
      if (!hasNativeText) {
        console.log("⚠️ Aucun texte natif trouvé, utilisation de Tesseract OCR...");
        
        // Initialiser Tesseract
        const worker = await this.initTesseract();
        
        // Traiter chaque page avec OCR
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          console.log(`🔍 OCR Tesseract page ${pageNum}/${totalPages}...`);
          
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 });
          
          // Créer un canvas pour render la page
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          // Rendre la page en image
          await page.render({
            canvasContext: context,
            viewport
          }).promise;
          
          // OCR sur l'image
          const { data: { text } } = await worker.recognize(canvas);
          
          if (text) {
            pagesAvecTexte++;
            fullText += `--- PAGE ${pageNum} (OCR) ---\n${text}\n\n`;
            console.log(`✅ Page ${pageNum}: ${text.length} caractères (OCR)`);
          }
        }
      }

      console.log(`✅ OCR terminé: ${fullText.length} caractères sur ${pagesAvecTexte}/${totalPages} pages`);

      return {
        success: true,
        text: fullText,
        pages: totalPages,
        pagesAvecTexte,
        fileName: file.name,
        method: hasNativeText ? 'native' : 'ocr'
      };

    } catch (error) {
      console.error('❌ Erreur OCR:', error);
      return {
        success: false,
        error: error.message,
        text: ''
      };
    }
  }

  // Nettoyer Tesseract
  async terminate() {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
    }
  }
}

export default new OCRService();