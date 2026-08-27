// @ts-nocheck
// src/Composant/OCRTextModal.js
import React from 'react';
import { FaTimes, FaFileAlt, FaCopy, FaDownload, FaPrint } from 'react-icons/fa';

const OCRTextModal = ({ isOpen, onClose, textData }) => {
    if (!isOpen || !textData) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(textData.text);
        alert('📋 Texte copié dans le presse-papiers !');
    };

    const handleDownload = () => {
        const blob = new Blob([textData.text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${textData.nom.replace('.pdf', '')}_OCR.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>OCR - ${textData.nom}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { color: #333; font-size: 18px; }
                        pre { white-space: pre-wrap; word-wrap: break-word; background: #f5f5f5; padding: 15px; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <h1>📄 ${textData.nom}</h1>
                    <p><strong>Pages:</strong> ${textData.pages || 1}</p>
                    <hr>
                    <pre>${textData.text}</pre>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <>
            <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
            <div className="modal fade show block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1051 }}>
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content border border-slate-200-0 shadow-lg" style={{ maxHeight: '90vh' }}>
                        
                        {/* En-tête */}
                        <div className="modal-header bg-indigo-600 text-white sticky-top">
                            <div className="flex items-center">
                                <FaFileAlt className="mr-2" style={{ fontSize: '1.5rem' }} />
                                <div>
                                    <h5 className="modal-title mb-0">Texte extrait par OCR</h5>
                                    <small className="block">
                                        {textData.nom} • {textData.pages || 1} page(s)
                                    </small>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                className="close text-white" 
                                onClick={onClose}
                            >
                                <span>&times;</span>
                            </button>
                        </div>

                        {/* Corps */}
                        <div className="modal-body">
                            {/* Barre d'outils */}
                            <div className="flex justify-end mb-3">
                                <button 
                                    className="btn btn-sm btn-outline-primary mr-2"
                                    onClick={handleCopy}
                                    title="Copier le texte"
                                >
                                    <FaCopy className="mr-1" /> Copier
                                </button>
                                <button 
                                    className="btn btn-sm btn-outline-success mr-2"
                                    onClick={handleDownload}
                                    title="Télécharger le texte"
                                >
                                    <FaDownload className="mr-1" /> Télécharger
                                </button>
                                <button 
                                    className="btn btn-sm btn-outline-info"
                                    onClick={handlePrint}
                                    title="Imprimer"
                                >
                                    <FaPrint className="mr-1" /> Imprimer
                                </button>
                            </div>

                            {/* Zone de texte */}
                            <div className="ocr-text-max-w-7xl mx-auto px-4" style={{ 
                                background: '#f8f9fa', 
                                padding: '20px', 
                                borderRadius: '8px',
                                maxHeight: '60vh',
                                overflowY: 'auto'
                            }}>
                                <pre style={{ 
                                    whiteSpace: 'pre-wrap', 
                                    wordWrap: 'break-word',
                                    fontFamily: 'Consolas, monospace',
                                    fontSize: '14px',
                                    margin: 0
                                }}>
                                    {textData.text || 'Aucun texte extrait'}
                                </pre>
                            </div>

                            {/* Statistiques */}
                            <div className="mt-3 text-gray-500 small flex justify-between">
                                <span>
                                    <strong>Caractères:</strong> {textData.text?.length || 0}
                                </span>
                                <span>
                                    <strong>Lignes:</strong> {textData.text?.split('\n').length || 0}
                                </span>
                                <span>
                                    <strong>Mots:</strong> {textData.text?.split(/\s+/).length || 0}
                                </span>
                            </div>
                        </div>

                        {/* Pied */}
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={onClose}>
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OCRTextModal;