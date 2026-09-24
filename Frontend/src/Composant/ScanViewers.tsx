// @ts-nocheck
import React, { useState, useEffect } from "react";
import axios from "axios";
import DetailModal from "../Modals/DetailModal";
import ConfirmModal from "../Modals/ConfirmModal";
import { SCANNER_SERVICE_URL } from "../config";
const ScanViewers = ({ onDocumentScanned }) => {
  const [scannedPDFs, setScannedPDFs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannerStatus, setScannerStatus] = useState({
    serverConnected: false,
    scannerDetected: false,
    lastError: null
  });
  const [recentScan, setRecentScan] = useState(null);

  useEffect(() => {
    checkScannerStatus();
    fetchScannedPDFs();
  }, []);

  // Vérifier le statut complet du scanner
  const checkScannerStatus = async () => {
    try {
      const healthResponse = await axios.get(`${SCANNER_SERVICE_URL}/health`, {
        timeout: 3000
      });
      
      const deviceResponse = await axios.get(`${SCANNER_SERVICE_URL}/scanner-device`, {
        timeout: 3000
      });
      
      const statusResponse = await axios.get(`${SCANNER_SERVICE_URL}/status`, {
        timeout: 3000
      });
      
      setScannerStatus({
        serverConnected: true,
        scannerDetected: deviceResponse.data.data?.hasScanner || false,
        lastError: statusResponse.data.data?.lastError || null
      });
      
      return deviceResponse.data.data?.hasScanner || false;
      
    } catch (error) {
      console.error("❌ Scanner non accessible:", error);
      setScannerStatus({
        serverConnected: false,
        scannerDetected: false,
        lastError: error.message
      });
      return false;
    }
  };

  // Scanner un document
  const handleScan = async () => {
    if (!scannerStatus.scannerDetected) {
      setDetailItem(row);
      return;
    }

    if (scanning) {
      toast.warning('Un scan est déjà en cours, patientez.');
      return;
    }

    try {
      setScanning(true);
      
      const scanModal = toast.info('Démarrage du scan');

      const startResponse = await axios.post(`${SCANNER_SERVICE_URL}/start-scan`);
      
      if (startResponse.data.status === 'success') {
        await monitorScanProgress(scanModal);
      } else {
        throw new Error(startResponse.data.message);
      }
      
    } catch (error) {
      console.error("❌ Erreur scan:", error);
      handleScanError(error);
    } finally {
      setScanning(false);
    }
  };

  // Suivre la progression du scan
  const monitorScanProgress = async (scanModal) => {
    let attempts = 0;
    const maxAttempts = 60;
    
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        attempts++;
        
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          reject(new Error("Timeout : Le scan prend trop de temps"));
          return;
        }

        try {
          const status = await axios.get(`${SCANNER_SERVICE_URL}/status`);
          
          if (!status.data.data?.isScanning) {
            clearInterval(checkInterval);
            
            if (status.data.data?.lastError) {
              reject(new Error(status.data.data.lastError));
            } else {
              const sessionsResponse = await axios.get(`${SCANNER_SERVICE_URL}/list-sessions`);
              const sessions = sessionsResponse.data.data?.sessions || [];
              
              const recentSession = sessions
                .filter(session => session.hasPdf && session.Status === "completed")
                .sort((a, b) => new Date(b.Created) - new Date(a.Created))[0];
              
              if (recentSession) {
                setRecentScan({
                  sessionId: recentSession.sessionId,
                  fileName: recentSession.fileName,
                  fileSize: recentSession.fileSize,
                  created: recentSession.Created
                });
                
                
                
                setDetailItem(recentSession).then((result) => {
                  if (result.isConfirmed) {
                    handleDownloadPDF(recentSession.sessionId, recentSession.fileName);
                  }
                });
                
                await fetchScannedPDFs();
              }
              
              resolve();
            }
          } else {
            if (scanModal && scanModal.update) {
              scanModal.update({
                html: `
                  <div style="text-align: center;">
                    <div class="spinner-border text-primary mb-3" role="status"></div>
                    <p>Scan en cours...</p>
                    <p class="text-muted small">
                      Pages scannées : ${status.data.data?.pagesScanned || 0}<br>
                      Étape : ${status.data.data?.currentStep || 'Initialisation'}
                    </p>
                  </div>
                `
              });
            }
          }
        } catch (error) {
          // Continuer à vérifier
        }
      }, 2000);
    });
  };

  // Gérer les erreurs de scan
  const handleScanError = (error) => {
    console.error("❌ Erreur scan:", error);
    
    let title = "Erreur de scan";
    let message = error.message || "Impossible de scanner le document";
    
    if (message.includes("Aucun scanner WIA détecté")) {
      title = "Scanner non branché";
      message = "Branchez votre scanner USB et redémarrez l'application.";
    }
    
    setDetailItem(row);
    
    checkScannerStatus();
  };

  // Fonction pour télécharger le document scanné
  const handleUseScannedDocument = async (sessionId, fileName) => {
    try {
      // Appeler directement la fonction de téléchargement
      await handleDownloadPDF(sessionId, fileName);
      
    } catch (error) {
      console.error("❌ Erreur téléchargement:", error);
      toast.error('Impossible de télécharger le fichier.');
    }
  };

  // Récupérer les PDFs
  const fetchScannedPDFs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${SCANNER_SERVICE_URL}/list-sessions`);
      
      if (response.data.status === 'success') {
        const sessions = response.data.data?.sessions || [];
        const pdfs = sessions
          .filter(session => session.hasPdf && session.Status === "completed")
          .map(session => ({
            id: session.sessionId,
            name: session.fileName || `scan_${new Date(session.Created).toLocaleDateString('fr-FR')}.pdf`,
            size: session.fileSize,
            date: session.Created,
            sessionId: session.sessionId
          }));
        
        setScannedPDFs(pdfs);
      }
    } catch (error) {
      console.error("❌ Erreur récupération PDFs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prévisualiser un PDF
  const handlePreviewPDF = async (sessionId, fileName) => {
    try {
      await showPdfInModal(sessionId, fileName);
    } catch (error) {
      console.error("❌ Erreur prévisualisation:", error);
      toast.error('Impossible d\'ouvrir le PDF.');
    }
  };

  // Fonction pour afficher le PDF dans une modal
  const showPdfInModal = async (sessionId, fileName) => {
    try {
      toast.info('Chargement...');
      const response = await axios.get(`${SCANNER_SERVICE_URL}/download/${sessionId}`, {
        responseType: 'blob'
      });
      const blob = response.data;
      const blobURL = URL.createObjectURL(blob);
      // Ouvrir le PDF dans un nouvel onglet / modal
      window.open(blobURL, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobURL), 1000);
      toast.success('PDF ouvert');
    } catch (error) {
      console.error("❌ Erreur affichage PDF:", error);
      toast.error('Impossible d\'afficher le PDF.');
    }
  };

  // Télécharger un PDF
  const handleDownloadPDF = async (sessionId, fileName) => {
    try {
      // Afficher un indicateur de chargement
      toast.info('Téléchargement...');

      const response = await axios.get(`${SCANNER_SERVICE_URL}/download/${sessionId}`, {
        responseType: 'blob'
      });
      
      const blob = response.data;
      const downloadURL = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadURL;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Nettoyer
      setTimeout(() => URL.revokeObjectURL(downloadURL), 1000);
      
      
      
      // Afficher un message de succès
      toast.success(`Le fichier "${fileName}" a été téléchargé.`);
      
    } catch (error) {
      console.error("❌ Erreur téléchargement:", error);
      toast.error('Impossible de télécharger le PDF.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '15px',
        borderBottom: '2px solid #007bff'
      }}>
        <div>
          <h1 style={{ color: '#333', margin: 0 }}>📄 Scanner Windows</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>
            {scannerStatus.serverConnected 
              ? (scannerStatus.scannerDetected ? 'Scanner détecté et prêt' : 'Serveur accessible - Scanner non détecté')
              : 'Serveur non connecté'
            }
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              checkScannerStatus();
              fetchScannedPDFs();
            }}
            disabled={loading || scanning}
            style={{
              padding: '8px 16px',
              backgroundColor: loading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {loading ? '🔄 Chargement...' : '🔄 Vérifier le statut'}
          </button>
          
          <button
            onClick={handleScan}
            disabled={scanning || !scannerStatus.scannerDetected}
            style={{
              padding: '8px 16px',
              backgroundColor: !scannerStatus.scannerDetected ? '#6c757d' : scanning ? '#ffc107' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: !scannerStatus.scannerDetected || scanning ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            title={!scannerStatus.scannerDetected ? 'Branchez d\'abord un scanner' : ''}
          >
            {scanning ? '📡 Scan en cours...' : '📄 Scanner un document'}
          </button>
        </div>
      </div>

      {/* Notification de scan récent */}
      {recentScan && (
        <div style={{
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          padding: '15px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>✅</span>
            <strong>Document scanné récemment :</strong> {recentScan.fileName}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handlePreviewPDF(recentScan.sessionId, recentScan.fileName)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              👁️ Prévisualiser
            </button>
            <button
              onClick={() => handleDownloadPDF(recentScan.sessionId, recentScan.fileName)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📥 Télécharger
            </button>
          </div>
        </div>
      )}

      {/* Avertissement si pas de scanner */}
      {scannerStatus.serverConnected && !scannerStatus.scannerDetected && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          color: '#721c24'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '32px' }}>🔌</span>
            <div>
              <h3 style={{ margin: '0 0 10px 0' }}>Scanner non détecté</h3>
              <p style={{ margin: '5px 0' }}>
                Le serveur est accessible mais <strong>aucun scanner n'est détecté</strong> par Windows.
              </p>
              <p style={{ margin: '10px 0 5px 0', fontWeight: 'bold' }}>Solution :</p>
              <ol style={{ margin: '5px 0', paddingLeft: '20px' }}>
                <li>Branchez votre scanner USB à l'ordinateur</li>
                <li>Allumez le scanner (le voyant doit s'allumer)</li>
                <li>Attendez 10 secondes que Windows détecte le périphérique</li>
                <li>Cliquez sur "Vérifier le statut" ci-dessus</li>
                <li>Si toujours pas détecté, redémarrez l'application Windows Scanner</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '50px',
          color: '#6c757d'
        }}>
          <div className="spinner-border border-slate-200" role="status" style={{
            width: '3rem',
            height: '3rem',
            color: '#007bff'
          }}>
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p style={{ marginTop: '20px' }}>Chargement...</p>
        </div>
      ) : scannedPDFs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '2px dashed #dee2e6'
        }}>
          <div style={{ fontSize: '64px', color: '#adb5bd', marginBottom: '20px' }}>
            📄
          </div>
          <h3 style={{ color: '#6c757d', marginBottom: '10px' }}>
            {scannerStatus.scannerDetected ? 'Aucun document scanné' : 'Connectez un scanner'}
          </h3>
          <p style={{ color: '#6c757d', maxWidth: '500px', margin: '0 auto 20px' }}>
            {scannerStatus.scannerDetected 
              ? 'Scannez votre premier document en cliquant sur "Scanner un document"'
              : 'Branchez un scanner USB pour commencer à numériser'
            }
          </p>
          {scannerStatus.scannerDetected && (
            <button
              onClick={handleScan}
              style={{
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🚀 Scanner mon premier document
            </button>
          )}
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #dee2e6'
          }}>
            <h3 style={{ margin: 0, color: '#495057' }}>
              Documents scannés ({scannedPDFs.length})
            </h3>
          </div>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '800px'
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#f1f3f4',
                borderBottom: '2px solid #dee2e6'
              }}>
                <th style={{ padding: '16px', textAlign: 'left', color: '#495057' }}>Nom du fichier</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#495057' }}>Taille</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#495057' }}>Date de scan</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#495057' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scannedPDFs.map((pdf, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: '1px solid #e9ecef',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px', color: '#dc3545' }}>📄</span>
                      <div style={{ fontWeight: '500', color: '#212529' }}>
                        {pdf.name}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#495057' }}>
                    {formatSize(pdf.size)}
                  </td>
                  <td style={{ padding: '16px', color: '#495057' }}>
                    {formatDate(pdf.date)}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handlePreviewPDF(pdf.sessionId, pdf.name)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        👁️ Voir
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(pdf.sessionId, pdf.name)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}
                      >
                        📥 Télécharger
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .spinner-border {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          vertical-align: text-bottom;
          border: 0.25em solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spinner-border .75s linear infinite;
        }
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        @keyframes spinner-border {
          to { transform: rotate(360deg); }
        }
        tr:hover {
          background-color: #f8f9fa !important;
        }
        button:disabled {
          opacity: 0.6;
        }
        .pdf-preview-modal {
          max-width: 90% !important;
          max-height: 90vh !important;
        }
        .swal2-popup {
          padding: 20px !important;
        }
        .pdf-actions {
          margin-top: 20px;
        }
      `}</style>
                
</div>
  );
};

export default ScanViewers;
