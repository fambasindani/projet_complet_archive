// @ts-nocheck
import React, { useState, useEffect } from "react";
import axios from "axios";
import ConfirmModal from "../Modals/ConfirmModal";
const ScanViewer = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Charger les scans au démarrage
  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      setLoading(true);
      // CORRECTION: Utiliser la nouvelle route /list
      const response = await axios.get("http://localhost:8000/api/scans/list");
      
      if (response.data.status === 'success') {
        setScans(response.data.scans);
      } else {
        throw new Error(response.data.message || 'Erreur de chargement');
      }
      
    } catch (error) {
      console.error("Erreur chargement scans:", error);
      toast.error(error.response?.data?.message || 'Impossible de charger les scans');
    } finally {
      setLoading(false);
    }
  };

  const handleScanDocument = async () => {
    try {
      setScanning(true);
      
      toast.info('Veuillez placer les documents dans le scanner...');

      // 1. Démarrer le scan via l'application C#
      const response = await axios.post("http://localhost:9000/start-scan");
      
      if (response.data.status === 'success') {
        toast.info('Scan en cours');

        // Polling pour vérifier quand le scan est terminé
        let attempts = 0;
        const maxAttempts = 30; // 30 tentatives × 2 secondes = 60 secondes max
        
        const checkScanCompletion = setInterval(async () => {
          attempts++;
          
          if (attempts >= maxAttempts) {
            clearInterval(checkScanCompletion);
            toast.warning('Le scan prend plus de temps que prévu');
            setScanning(false);
            return;
          }

          try {
            // Vérifier si de nouveaux fichiers sont apparus
            await fetchScans();
            
            // Vérifier le statut de l'application C#
            const statusResponse = await axios.get("http://localhost:9000/status");
            
            if (!statusResponse.data.isScanning) {
              clearInterval(checkScanCompletion);
              
              toast.success('Le document a été scanné et envoyé avec succès');
              
              setScanning(false);
            }
          } catch (error) {
            // Ignorer les erreurs de polling
          }
        }, 2000); // Vérifier toutes les 2 secondes

      }
      
    } catch (error) {
      console.error("Erreur scan:", error);
      toast.error(error.response?.data?.message || 'Impossible de démarrer le scan');
      setScanning(false);
    }
  };

  const handlePreviewScan = (scan) => {
    window.open(scan.url, '_blank');
  };

  const handleDownloadScan = async (scan) => {
    try {
      // CORRECTION: Utiliser la nouvelle route de téléchargement
      const response = await axios.get(
        `http://localhost:8000/api/scans/download/${scan.name}`,
        { 
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf'
          }
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', scan.original_name || scan.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Libérer la mémoire
      window.URL.revokeObjectURL(url);
      
      toast.success('Fichier téléchargé avec succès');
      
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      toast.error(error.response?.data?.message || 'Impossible de télécharger le fichier');
    }
  };

  const handleDeleteScan = async (scan) => {
    const result = await toast.info('Supprimer ce scan?');

    if (result.isConfirmed) {
      try {
        // CORRECTION: Utiliser la nouvelle route de suppression par nom de fichier
        await axios.delete(`http://localhost:8000/api/scans/delete/${scan.name}`);
        
        toast.success('Le scan a été supprimé avec succès.');
        
        // Recharger la liste
        fetchScans();
        
      } catch (error) {
        console.error('Erreur suppression:', error);
        toast.error(error.response?.data?.message || 'Impossible de supprimer le scan');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatSize = (size) => {
    if (typeof size === 'string') return size;
    if (typeof size === 'number') {
      if (size < 1024) return size + ' B';
      if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB';
      return (size / (1024 * 1024)).toFixed(2) + ' MB';
    }
    return 'N/A';
  };

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ 
        color: '#333',
        borderBottom: '2px solid #007bff',
        paddingBottom: '10px',
        marginBottom: '20px'
      }}>
        📄 Scanner de Documents
      </h2>
      
      <div style={{ 
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={handleScanDocument} 
          disabled={scanning || loading}
          style={{
            padding: '12px 24px',
            backgroundColor: scanning ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: scanning ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s',
            opacity: scanning || loading ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            if (!scanning && !loading) {
              e.target.style.backgroundColor = '#0056b3';
            }
          }}
          onMouseLeave={(e) => {
            if (!scanning && !loading) {
              e.target.style.backgroundColor = '#007bff';
            }
          }}
        >
          {scanning ? (
            <>
              <span className="spinner-border border-slate-200 spinner-border border-slate-200-sm" role="status" />
              Scan en cours...
            </>
          ) : (
            <>
              <span>📄</span>
              Scanner un document
            </>
          )}
        </button>
        
        <button 
          onClick={fetchScans} 
          disabled={loading || scanning}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#adb5bd' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#545b62';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.backgroundColor = '#6c757d';
            }
          }}
        >
          {loading ? (
            <>
              <span className="spinner-border border-slate-200 spinner-border border-slate-200-sm" role="status" />
              Chargement...
            </>
          ) : (
            <>
              <span>🔄</span>
              Rafraîchir la liste
            </>
          )}
        </button>
        
        <div style={{ marginLeft: 'auto', color: '#6c757d', fontSize: '14px' }}>
          {scans.length} document(s) trouvé(s)
        </div>
      </div>
      
      {loading && scans.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#6c757d'
        }}>
          <div className="spinner-border border-slate-200 text-indigo-600" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p style={{ marginTop: '20px' }}>Chargement des scans...</p>
        </div>
      ) : scans.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '2px dashed #dee2e6'
        }}>
          <div style={{ fontSize: '48px', color: '#adb5bd', marginBottom: '20px' }}>
            📄
          </div>
          <h4 style={{ color: '#6c757d', marginBottom: '10px' }}>
            Aucun scan disponible
          </h4>
          <p style={{ color: '#6c757d', maxWidth: '500px', margin: '0 auto' }}>
            Scannez votre premier document en cliquant sur le bouton "Scanner un document"
          </p>
        </div>
      ) : (
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '800px'
            }}>
              <thead>
                <tr style={{ 
                  backgroundColor: '#f8f9fa',
                  borderBottom: '2px solid #dee2e6'
                }}>
                  <th style={{ 
                    padding: '16px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6'
                  }}>
                    Nom du fichier
                  </th>
                  <th style={{ 
                    padding: '16px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6'
                  }}>
                    Taille
                  </th>
                  <th style={{ 
                    padding: '16px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6'
                  }}>
                    Pages
                  </th>
                  <th style={{ 
                    padding: '16px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6'
                  }}>
                    Date
                  </th>
                  <th style={{ 
                    padding: '16px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#495057',
                    borderBottom: '2px solid #dee2e6'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {scans.map((scan, index) => (
                  <tr 
                    key={index} 
                    style={{ 
                      borderBottom: '1px solid #e9ecef',
                      transition: 'background-color 0.2s',
                      ':hover': {
                        backgroundColor: '#f8f9fa'
                      }
                    }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ 
                          fontSize: '20px',
                          color: '#dc3545'
                        }}>
                          📄
                        </span>
                        <div>
                          <div style={{ fontWeight: '500', color: '#212529' }}>
                            {scan.name}
                          </div>
                          {scan.original_name && scan.original_name !== scan.name && (
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#6c757d',
                              marginTop: '2px'
                            }}>
                              Original: {scan.original_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: '#495057' }}>
                      {formatSize(scan.size)}
                    </td>
                    <td style={{ padding: '16px', color: '#495057' }}>
                      <span style={{ 
                        display: 'inline-block',
                        backgroundColor: '#e7f1ff',
                        color: '#007bff',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {scan.pages || 1} page{scan.pages > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#495057' }}>
                      {formatDate(scan.modified || scan.created_at)}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button 
                          onClick={() => handlePreviewScan(scan)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#138496'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#17a2b8'}
                          title="Prévisualiser"
                        >
                          👁️ Voir
                        </button>
                        <button 
                          onClick={() => handleDownloadScan(scan)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
                          title="Télécharger"
                        >
                          ⬇️ Télécharger
                        </button>
                        <button 
                          onClick={() => handleDeleteScan(scan)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                          title="Supprimer"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Styles pour les spinners Bootstrap */}
      <style>{`
        @keyframes spinner-border {
          to { transform: rotate(360deg); }
        }
        
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
        
        .spinner-border-sm {
          width: 0.8rem;
          height: 0.8rem;
          border-width: 0.2em;
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
      `}</style>
                
</div>
  );
};

export default ScanViewer;