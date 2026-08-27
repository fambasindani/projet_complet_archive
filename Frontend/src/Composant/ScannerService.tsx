// @ts-nocheck
// src/services/scannerService.js
import { API_BASE_URL } from "../config";

class ScannerService {
    constructor() {
        this.baseUrl = 'http://localhost:8081';
        this.isConnected = false;
        console.log("🔧 ScannerService initialisé avec URL:", this.baseUrl);
    }

    // Vérifier si le scanner est disponible
    async checkConnection() {
        console.log("🔍 Vérification connexion scanner...");
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${this.baseUrl}/api/ping`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                this.isConnected = data.ready || false;
                console.log("✅ Scanner connecté:", data);
                return {
                    connected: this.isConnected,
                    message: this.isConnected ? 'Scanner détecté' : 'Scanner non prêt',
                    data: data
                };
            }
        } catch (error) {
            console.log('❌ Scanner non disponible:', error.message);
            if (error.name === 'AbortError') {
                console.log('⏱️ Timeout - Le scanner ne répond pas');
            }
        }
        
        this.isConnected = false;
        return {
            connected: false,
            message: 'Scanner Windows non détecté',
            error: 'CONNECTION_FAILED'
        };
    }

    // Définir les informations du document
    async setDocumentInfo(documentId, classeurId, token, nomFichier) {
        console.log("📤 Envoi infos document au scanner:", { documentId, classeurId, nomFichier });
        try {
            const response = await fetch(`${this.baseUrl}/api/setinfo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    documentId: parseInt(documentId),
                    classeurId: parseInt(classeurId),
                    token: token,
                    nom_fichier: nomFichier 
                })
            });
            
            const data = await response.json();
            console.log("✅ Réponse setinfo:", data);
            return data;
        } catch (error) {
            console.error("❌ Erreur setinfo:", error);
            return {
                success: false,
                message: `Erreur communication: ${error.message}`
            };
        }
    }

    // Définir l'URL de l'API Laravel
    async setApiUrl(apiUrl) {
        console.log("📤 Envoi URL API au scanner:", apiUrl);
        try {
            const response = await fetch(`${this.baseUrl}/api/seturl`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    url: apiUrl
                })
            });
            
            const data = await response.json();
            console.log("✅ Réponse seturl:", data);
            return data;
        } catch (error) {
            console.error("❌ Erreur seturl:", error);
            return {
                success: false,
                message: `Erreur communication: ${error.message}`
            };
        }
    }

    // Démarrer le scan
    async startScan() {
        console.log("📤 Demande de démarrage scan...");
        try {
            const response = await fetch(`${this.baseUrl}/api/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({})
            });
            
            const data = await response.json();
            console.log("✅ Réponse startScan:", data);
            return data;
        } catch (error) {
            console.error("❌ Erreur startScan:", error);
            return {
                success: false,
                message: `Impossible de démarrer le scan: ${error.message}`
            };
        }
    }

    // Vérifier l'état du scan
    async getScanStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/api/status`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log("📊 Statut scan:", data);
                return data;
            }
        } catch (error) {
            console.log("⚠️ Erreur getScanStatus:", error.message);
        }
        
        return { success: false, scanning: false };
    }

    // Tester la connexion avec instructions
    async testConnectionWithInstructions() {
        console.log("🧪 Test de connexion au scanner...");
        const result = await this.checkConnection();
        
        if (!result.connected) {
            return {
                connected: false,
                title: 'Scanner non disponible',
                instructions: `
                    <div style="text-align: left;">
                        <p style="color: #dc3545;"><strong>❌ L'application scanner Windows n'est pas détectée.</strong></p>
                        <p><strong>Pour utiliser le scanner :</strong></p>
                        <ol style="margin-left: 20px;">
                            <li>Lancez l'application <strong>WindowScan.exe</strong> (elle doit être en cours d'exécution)</li>
                            <li>Vérifiez qu'elle écoute bien sur le port <strong>8081</strong></li>
                            <li>Regardez la fenêtre de logs du scanner pour voir les erreurs éventuelles</li>
                            <li>Vérifiez que votre pare-feu n bloque pas la connexion</li>
                        </ol>
                        <hr>
                        <p style="color: #666; font-size: 0.9em;">
                            <strong>URL du scanner :</strong> ${this.baseUrl}<br>
                            <strong>Dernière vérification :</strong> ${new Date().toLocaleTimeString()}<br>
                            <strong>Erreur :</strong> ${result.error || 'Connexion refusée'}
                        </p>
                    </div>
                `
            };
        }
        
        return result;
    }
}

// Export une instance unique
const scannerService = new ScannerService();
export default scannerService;