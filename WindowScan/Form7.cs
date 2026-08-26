using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using iTextSharp.text;
using iTextSharp.text.pdf;
using WIA;

namespace WindowScan
{
    public partial class Form7 : Form
    {
        private List<string> scannedImages = new List<string>();
        private readonly string tempFolder = Path.Combine(Path.GetTempPath(), "WindowScan");
        private bool isScanning = false;

        // Définitions des callbacks
        public Action<string> OnLogMessage;
        public Action<string, byte[]> OnScanSuccess;
        public Action<string> OnScanError;
        public Action OnScanStarted;
        public Action OnScanFinished;

        // Supprimez cette déclaration car elle est déjà dans Form7.Designer.cs
        // private System.Windows.Forms.TextBox textBoxLogs;

        public Form7()
        {
            InitializeComponent(); // Cette méthode est dans Form7.Designer.cs
            SetupForm();
        }

        private void SetupForm()
        {
            this.Text = "Scanner Windows Service";
            this.StartPosition = FormStartPosition.CenterScreen;

            // Configuration du TextBox pour les logs (s'assurer qu'il existe)
            if (textBoxLogs != null)
            {
                textBoxLogs.Multiline = true;
                textBoxLogs.ScrollBars = ScrollBars.Vertical;
                textBoxLogs.ReadOnly = true;
                textBoxLogs.Dock = DockStyle.Fill;
                textBoxLogs.BackColor = System.Drawing.Color.Black;
                textBoxLogs.ForeColor = System.Drawing.Color.Lime;
                textBoxLogs.Font = new System.Drawing.Font("Consolas", 9F);
            }

            // Création du dossier temporaire
            if (!Directory.Exists(tempFolder))
            {
                Directory.CreateDirectory(tempFolder);
                Log("📁 Dossier temporaire créé: " + tempFolder);
            }

            Log("🟢 Service Windows Scanner démarré et prêt");
        }

        /// <summary>
        /// Vérifie si un scanner est disponible (méthode publique pour l'API)
        /// </summary>
        public bool CheckScannerAvailable()
        {
            try
            {
                Log("🔍 Vérification de la disponibilité du scanner...");
                var scanner = FindScannerInternal();
                bool available = scanner != null;
                Log(available ? "✅ Scanner disponible" : "❌ Scanner non disponible");
                return available;
            }
            catch (Exception ex)
            {
                Log($"❌ Erreur lors de la vérification du scanner: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Démarre le processus de scan
        /// </summary>
        public void StartScan()
        {
            if (isScanning)
            {
                Log("⚠️ Un scan est déjà en cours");
                return;
            }

            try
            {
                scannedImages.Clear();
                isScanning = true;

                OnScanStarted?.Invoke();
                Log("🌀 Démarrage du scan...");

                // Exécuter le scan dans un thread séparé
                Thread scanThread = new Thread(ExecuteScan);
                scanThread.SetApartmentState(ApartmentState.STA);
                scanThread.IsBackground = true;
                scanThread.Start();
            }
            catch (Exception ex)
            {
                Log($"❌ Erreur démarrage scan: {ex.Message}");
                isScanning = false;
                OnScanError?.Invoke(ex.Message);
            }
        }

        private void ExecuteScan()
        {
            try
            {
                Log("🔍 Recherche du scanner...");
                var scanner = FindScannerInternal();

                if (scanner == null)
                {
                    throw new Exception("Aucun scanner WIA détecté. Vérifiez la connexion USB et que le scanner est allumé.");
                }

                Log($"✅ Scanner trouvé: {GetScannerName(scanner)}");

                Log("📄 Début du scan des pages...");
                ScanPages(scanner);

                if (scannedImages.Count == 0)
                {
                    throw new Exception("Aucune page scannée. Vérifiez le document dans le scanner.");
                }

                Log($"✅ {scannedImages.Count} page(s) scannée(s) avec succès");

                Log("🔄 Création du PDF...");
                var pdfResult = CreatePdfDocument();

                if (pdfResult.success)
                {
                    byte[] pdfBytes = File.ReadAllBytes(pdfResult.filePath);

                    Log($"✅ PDF créé: {Path.GetFileName(pdfResult.filePath)} ({pdfBytes.Length / 1024} KB)");

                    OnScanSuccess?.Invoke(pdfResult.filePath, pdfBytes);
                }
                else
                {
                    throw new Exception($"Échec création PDF: {pdfResult.error}");
                }
            }
            catch (Exception ex)
            {
                Log($"❌ Erreur: {ex.Message}");
                OnScanError?.Invoke(ex.Message);
            }
            finally
            {
                CleanupTempImages();
                isScanning = false;
                OnScanFinished?.Invoke();
                Log("🟢 Prêt pour un nouveau scan");
            }
        }

        /// <summary>
        /// Recherche un scanner connecté (méthode interne)
        /// </summary>
        private Device FindScannerInternal()
        {
            try
            {
                var deviceManager = new DeviceManager();
                Log($"🔍 Recherche parmi {deviceManager.DeviceInfos.Count} périphérique(s)...");

                for (int i = 1; i <= deviceManager.DeviceInfos.Count; i++)
                {
                    var deviceInfo = deviceManager.DeviceInfos[i];

                    if (deviceInfo.Type == WiaDeviceType.ScannerDeviceType)
                    {
                        try
                        {
                            var device = deviceInfo.Connect();
                            Log($"✅ Scanner détecté: {GetScannerName(device)}");
                            return device;
                        }
                        catch (Exception connectEx)
                        {
                            Log($"⚠️ Erreur connexion scanner: {connectEx.Message}");
                        }
                    }
                }

                Log("❌ Aucun scanner WIA trouvé");
                return null;
            }
            catch (COMException comEx)
            {
                Log($"❌ Erreur COM: {comEx.Message}");
                return null;
            }
            catch (Exception ex)
            {
                Log($"❌ Erreur détection scanner: {ex.Message}");
                return null;
            }
        }

        private string GetScannerName(Device scanner)
        {
            try
            {
                if (scanner != null && scanner.Properties != null)
                {
                    foreach (Property prop in scanner.Properties)
                    {
                        if (prop.Name == "Name" || prop.PropertyID == 7) // WIA_DIP_DEV_NAME
                        {
                            object value = prop.get_Value();
                            if (value != null)
                            {
                                return value.ToString();
                            }
                        }
                    }
                }
                return "Scanner inconnu";
            }
            catch
            {
                return "Scanner (nom non disponible)";
            }
        }

        private void ScanPages(Device scanner)
        {
            int pageNumber = 1;
            bool morePages = true;

            try
            {
                var item = scanner.Items[1];

                Log("🔄 Configuration du scanner...");

                // Essayer le mode ADF d'abord, puis le mode plat
                bool adfAvailable = false;
                try
                {
                    SetWiaProperty(item.Properties, "Document Handling Select", 1); // ADF
                    SetWiaProperty(item.Properties, "Pages", 1);
                    adfAvailable = true;
                    Log("✅ Mode ADF activé");
                }
                catch
                {
                    try
                    {
                        SetWiaProperty(item.Properties, "Document Handling Select", 0); // Flatbed
                        adfAvailable = false;
                        Log("✅ Mode plat activé");
                    }
                    catch
                    {
                        Log("⚠️ Configuration automatique, utilisation des paramètres par défaut");
                    }
                }

                // Configuration de base
                try
                {
                    SetWiaProperty(item.Properties, "Horizontal Resolution", 200);
                    SetWiaProperty(item.Properties, "Vertical Resolution", 200);
                    SetWiaProperty(item.Properties, "Color Mode", 1); // Couleur
                    Log("✅ Résolution: 200 DPI, Couleur");
                }
                catch
                {
                    Log("⚠️ Impossible de configurer la résolution");
                }

                Log("✅ Configuration terminée");

                var dialog = new WIA.CommonDialog();

                while (morePages && pageNumber <= 50)
                {
                    try
                    {
                        Log($"📄 Scan de la page {pageNumber}...");

                        ImageFile image = (ImageFile)dialog.ShowTransfer(item, "{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}", false);

                        if (image != null && image.FileData != null)
                        {
                            string imagePath = Path.Combine(tempFolder,
                                $"scan_{pageNumber}_{DateTime.Now:yyyyMMdd_HHmmss}.jpg");

                            if (File.Exists(imagePath))
                                File.Delete(imagePath);

                            image.SaveFile(imagePath);
                            scannedImages.Add(imagePath);

                            Log($"✅ Page {pageNumber} scannée ({new FileInfo(imagePath).Length / 1024} KB)");
                            pageNumber++;

                            // Vérifier s'il y a plus de pages (uniquement en mode ADF)
                            if (adfAvailable)
                            {
                                try
                                {
                                    Thread.Sleep(1000); // Pause pour l'ADF
                                    continue;
                                }
                                catch
                                {
                                    morePages = false;
                                }
                            }
                            else
                            {
                                // Mode plat - une seule page
                                morePages = false;
                                Log("📭 Mode plat - Fin du scan");
                            }
                        }
                        else
                        {
                            morePages = false;
                            Log("📭 Pas d'image retournée - Fin du scan");
                        }
                    }
                    catch (COMException comEx)
                    {
                        if (comEx.ErrorCode == -2145320954 || // WIA_ERROR_PAPER_EMPTY
                            comEx.Message.Contains("no more pages") ||
                            comEx.Message.Contains("There are no more pages"))
                        {
                            morePages = false;
                            Log("📭 Fin du document atteinte");
                        }
                        else if (comEx.ErrorCode == -2145320957) // WIA_ERROR_PAPER_JAM
                        {
                            Log($"⚠️ Bourrage papier détecté: {comEx.Message}");
                            morePages = false;
                            throw new Exception("Bourrage papier détecté. Vérifiez le scanner.");
                        }
                        else
                        {
                            Log($"⚠️ Erreur COM lors du scan: {comEx.Message}");
                            morePages = false;
                        }
                    }
                    catch (Exception ex)
                    {
                        Log($"⚠️ Erreur scan page {pageNumber}: {ex.Message}");
                        morePages = false;
                    }
                }

                Log($"📊 Total: {scannedImages.Count} page(s) scannée(s)");
            }
            catch (Exception ex)
            {
                throw new Exception($"Erreur lors du scan: {ex.Message}", ex);
            }
        }

        private object GetWiaProperty(IProperties properties, string propertyName)
        {
            try
            {
                foreach (Property prop in properties)
                {
                    if (prop.Name == propertyName)
                    {
                        return prop.get_Value();
                    }
                }
                return null;
            }
            catch
            {
                return null;
            }
        }

        private void SetWiaProperty(IProperties properties, string propertyName, object value)
        {
            try
            {
                foreach (Property prop in properties)
                {
                    if (prop.Name == propertyName)
                    {
                        prop.set_Value(value);
                        return;
                    }
                }
            }
            catch (Exception ex)
            {
                Log($"⚠️ Impossible de définir {propertyName}: {ex.Message}");
                throw;
            }
        }

        private (bool success, string filePath, string error) CreatePdfDocument()
        {
            try
            {
                if (scannedImages.Count == 0)
                {
                    return (false, null, "Aucune image à convertir en PDF");
                }

                string pdfFileName = $"document_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";
                string pdfFilePath = Path.Combine(tempFolder, pdfFileName);

                using (FileStream fs = new FileStream(pdfFilePath, FileMode.Create))
                using (Document document = new Document())
                using (PdfWriter writer = PdfWriter.GetInstance(document, fs))
                {
                    document.Open();

                    foreach (string imagePath in scannedImages)
                    {
                        if (File.Exists(imagePath))
                        {
                            try
                            {
                                iTextSharp.text.Image image = iTextSharp.text.Image.GetInstance(imagePath);

                                // Redimensionner pour s'adapter à la page A4
                                image.ScaleToFit(document.PageSize.Width - 72, document.PageSize.Height - 72);
                                image.Alignment = Element.ALIGN_CENTER;

                                document.Add(image);

                                // Ajouter une nouvelle page sauf pour la dernière image
                                if (imagePath != scannedImages[scannedImages.Count - 1])
                                {
                                    document.NewPage();
                                }
                            }
                            catch (Exception imgEx)
                            {
                                Log($"⚠️ Erreur image {imagePath}: {imgEx.Message}");
                                // Continuer avec les images suivantes
                            }
                        }
                    }

                    document.Close();
                }

                return (true, pdfFilePath, null);
            }
            catch (Exception ex)
            {
                return (false, null, ex.Message);
            }
        }

        private void CleanupTempImages()
        {
            try
            {
                int deletedCount = 0;

                foreach (string imagePath in scannedImages)
                {
                    try
                    {
                        if (File.Exists(imagePath))
                        {
                            File.Delete(imagePath);
                            deletedCount++;
                        }
                    }
                    catch { }
                }

                scannedImages.Clear();

                if (deletedCount > 0)
                {
                    Log($"🧹 {deletedCount} image(s) temporaire(s) nettoyée(s)");
                }
            }
            catch (Exception ex)
            {
                Log($"⚠️ Erreur nettoyage: {ex.Message}");
            }
        }

        /// <summary>
        /// Nettoie les anciens fichiers
        /// </summary>
        public void CleanupOldFiles(int maxAgeHours = 24)
        {
            try
            {
                if (!Directory.Exists(tempFolder)) return;

                var files = Directory.GetFiles(tempFolder, "*.*");
                DateTime cutoff = DateTime.Now.AddHours(-maxAgeHours);
                int deletedCount = 0;

                foreach (string file in files)
                {
                    try
                    {
                        FileInfo fi = new FileInfo(file);
                        if (fi.LastWriteTime < cutoff)
                        {
                            File.Delete(file);
                            deletedCount++;
                        }
                    }
                    catch { }
                }

                if (deletedCount > 0)
                {
                    Log($"🧹 {deletedCount} ancien(s) fichier(s) nettoyé(s)");
                }
            }
            catch { }
        }

        private void Log(string message)
        {
            string timestampedMessage = $"[{DateTime.Now:HH:mm:ss}] {message}";

            // Journaliser dans la console
            Console.WriteLine(timestampedMessage);

            // Mettre à jour l'interface utilisateur si nécessaire
            if (textBoxLogs != null && !textBoxLogs.IsDisposed)
            {
                if (textBoxLogs.InvokeRequired)
                {
                    textBoxLogs.Invoke(new Action(() =>
                    {
                        textBoxLogs.AppendText(timestampedMessage + Environment.NewLine);
                        textBoxLogs.ScrollToCaret();
                    }));
                }
                else
                {
                    textBoxLogs.AppendText(timestampedMessage + Environment.NewLine);
                    textBoxLogs.ScrollToCaret();
                }
            }

            // Appeler le callback
            OnLogMessage?.Invoke(timestampedMessage);
        }

        // Propriétés publiques
        public bool IsScanning => isScanning;
        public string TempFolderPath => tempFolder;

        private void Form7_FormClosing(object sender, FormClosingEventArgs e)
        {
            CleanupOldFiles(0);
            Log("🛑 Fermeture de l'application...");
        }

        private void Form7_Load(object sender, EventArgs e)
        {
            // Initialisation
        }

        private void textBoxLogs_TextChanged(object sender, EventArgs e)
        {
            // Gestion du changement de texte
        }

        // SUPPRIMEZ cette méthode InitializeComponent() car elle est déjà dans Form7.Designer.cs
        // private void InitializeComponent()
        // {
        //     this.textBoxLogs = new System.Windows.Forms.TextBox();
        //     this.SuspendLayout();
        //     // 
        //     // textBoxLogs
        //     // 
        //     this.textBoxLogs.Dock = System.Windows.Forms.DockStyle.Fill;
        //     this.textBoxLogs.Location = new System.Drawing.Point(0, 0);
        //     this.textBoxLogs.Multiline = true;
        //     this.textBoxLogs.Name = "textBoxLogs";
        //     this.textBoxLogs.ReadOnly = true;
        //     this.textBoxLogs.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
        //     this.textBoxLogs.Size = new System.Drawing.Size(800, 450);
        //     this.textBoxLogs.TabIndex = 0;
        //     this.textBoxLogs.TextChanged += new System.EventHandler(this.textBoxLogs_TextChanged);
        //     // 
        //     // Form7
        //     // 
        //     this.ClientSize = new System.Drawing.Size(800, 450);
        //     this.Controls.Add(this.textBoxLogs);
        //     this.Name = "Form7";
        //     this.Text = "Scanner Windows Service";
        //     this.Load += new System.EventHandler(this.Form7_Load);
        //     this.FormClosing += new System.Windows.Forms.FormClosingEventHandler(this.Form7_FormClosing);
        //     this.ResumeLayout(false);
        //     this.PerformLayout();
        // }
    }
}