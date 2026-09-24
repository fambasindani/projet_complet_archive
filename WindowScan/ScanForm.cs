using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Drawing2D;
using System.IO;
using System.Net.Http;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using iTextSharp.text;
using iTextSharp.text.pdf;
using Newtonsoft.Json;
using WIA;

namespace WindowScan
{
    public partial class ScanForm : Form
    {
        private List<string> scannedImages = new List<string>();
        private string laravelApiUrl;
        private string laravelApiBase = "http://localhost:8000";
        private string token = "";
        private int? idDeclaration = null;
        private int? idClasseur = null;
        private string nom_fichier = null;
        private string uploadType = "document";
        private int idMinistere = 0;
        private readonly string tempFolder = Path.Combine(Path.GetTempPath(), "WiaScans");
        private readonly string configFile = Path.Combine(Application.StartupPath, "scanner_config.json");

        public Action<string> OnLog;
        public Action<string, bool> OnScanComplete;
        private bool isScanning = false;

        // Déclaration des contrôles
        private TextBox txtApiUrl;
        private TextBox txtToken;
        private TextBox txtIdDeclaration;
        private TextBox txtIdClasseur;
        private Button btnSaveConfig;
        private Button btnStartScan;
        private TextBox txtLogs;
        private Label lblApiUrl;
        private Label lblToken;
        private Label lblIdDeclaration;
        private Label lblIdClasseur;

        public ScanForm()
        {
            InitializeComponent();
            CheckControlsInitialization();
            InitializeForm();
            LoadConfiguration();
        }

        private void InitializeComponent()
        {
            this.txtLogs = new System.Windows.Forms.TextBox();
            this.txtApiUrl = new System.Windows.Forms.TextBox();
            this.txtToken = new System.Windows.Forms.TextBox();
            this.txtIdDeclaration = new System.Windows.Forms.TextBox();
            this.txtIdClasseur = new System.Windows.Forms.TextBox();
            this.btnSaveConfig = new System.Windows.Forms.Button();
            this.btnStartScan = new System.Windows.Forms.Button();
            this.lblApiUrl = new System.Windows.Forms.Label();
            this.lblToken = new System.Windows.Forms.Label();
            this.lblIdDeclaration = new System.Windows.Forms.Label();
            this.lblIdClasseur = new System.Windows.Forms.Label();
            this.SuspendLayout();

            // txtLogs
            this.txtLogs.BackColor = System.Drawing.Color.White;
            this.txtLogs.ForeColor = System.Drawing.Color.Black;
            this.txtLogs.Location = new System.Drawing.Point(10, 135);
            this.txtLogs.Multiline = true;
            this.txtLogs.Name = "txtLogs";
            this.txtLogs.ReadOnly = true;
            this.txtLogs.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.txtLogs.Size = new System.Drawing.Size(678, 338);
            this.txtLogs.TabIndex = 10;

            // txtApiUrl
            this.txtApiUrl.Location = new System.Drawing.Point(160, 10);
            this.txtApiUrl.Name = "txtApiUrl";
            this.txtApiUrl.Size = new System.Drawing.Size(350, 22);
            this.txtApiUrl.TabIndex = 1;
            this.txtApiUrl.Text = "http://localhost:8000";

            // txtToken
            this.txtToken.Location = new System.Drawing.Point(160, 40);
            this.txtToken.Name = "txtToken";
            this.txtToken.Size = new System.Drawing.Size(350, 22);
            this.txtToken.TabIndex = 3;
            this.txtToken.UseSystemPasswordChar = true;

            // txtIdDeclaration
            this.txtIdDeclaration.Location = new System.Drawing.Point(160, 70);
            this.txtIdDeclaration.Name = "txtIdDeclaration";
            this.txtIdDeclaration.Size = new System.Drawing.Size(150, 22);
            this.txtIdDeclaration.TabIndex = 5;
            this.txtIdDeclaration.Visible = false;

            // txtIdClasseur
            this.txtIdClasseur.Location = new System.Drawing.Point(486, 70);
            this.txtIdClasseur.Name = "txtIdClasseur";
            this.txtIdClasseur.Size = new System.Drawing.Size(150, 22);
            this.txtIdClasseur.TabIndex = 7;
            this.txtIdClasseur.Visible = false;

            // btnSaveConfig
            this.btnSaveConfig.Enabled = false;
            this.btnSaveConfig.Location = new System.Drawing.Point(520, 10);
            this.btnSaveConfig.Name = "btnSaveConfig";
            this.btnSaveConfig.Size = new System.Drawing.Size(170, 30);
            this.btnSaveConfig.TabIndex = 8;
            this.btnSaveConfig.Text = "Enregistrer Configuration";

            // btnStartScan
            this.btnStartScan.BackColor = System.Drawing.Color.SteelBlue;
            this.btnStartScan.Font = new System.Drawing.Font("Microsoft Sans Serif", 10F, System.Drawing.FontStyle.Bold);
            this.btnStartScan.ForeColor = System.Drawing.Color.White;
            this.btnStartScan.Location = new System.Drawing.Point(10, 99);
            this.btnStartScan.Name = "btnStartScan";
            this.btnStartScan.Size = new System.Drawing.Size(662, 30);
            this.btnStartScan.TabIndex = 9;
            this.btnStartScan.Text = "DÉMARRER LE SCAN ET UPLOAD";
            this.btnStartScan.UseVisualStyleBackColor = false;

            // lblApiUrl
            this.lblApiUrl.AutoSize = true;
            this.lblApiUrl.Location = new System.Drawing.Point(10, 13);
            this.lblApiUrl.Name = "lblApiUrl";
            this.lblApiUrl.Size = new System.Drawing.Size(109, 16);
            this.lblApiUrl.TabIndex = 0;
            this.lblApiUrl.Text = "URL API Laravel:";

            // lblToken
            this.lblToken.AutoSize = true;
            this.lblToken.Location = new System.Drawing.Point(10, 43);
            this.lblToken.Name = "lblToken";
            this.lblToken.Size = new System.Drawing.Size(151, 16);
            this.lblToken.TabIndex = 2;
            this.lblToken.Text = "Token d'authentification:";

            // lblIdDeclaration
            this.lblIdDeclaration.AutoSize = true;
            this.lblIdDeclaration.Location = new System.Drawing.Point(10, 73);
            this.lblIdDeclaration.Name = "lblIdDeclaration";
            this.lblIdDeclaration.Size = new System.Drawing.Size(95, 16);
            this.lblIdDeclaration.TabIndex = 4;
            this.lblIdDeclaration.Text = "ID Déclaration:";
            this.lblIdDeclaration.Visible = false;

            // lblIdClasseur
            this.lblIdClasseur.AutoSize = true;
            this.lblIdClasseur.Location = new System.Drawing.Point(336, 73);
            this.lblIdClasseur.Name = "lblIdClasseur";
            this.lblIdClasseur.Size = new System.Drawing.Size(79, 16);
            this.lblIdClasseur.TabIndex = 6;
            this.lblIdClasseur.Text = "ID Classeur:";
            this.lblIdClasseur.Visible = false;

            // ScanForm
            this.ClientSize = new System.Drawing.Size(689, 485);
            this.Controls.Add(this.lblApiUrl);
            this.Controls.Add(this.txtApiUrl);
            this.Controls.Add(this.lblToken);
            this.Controls.Add(this.txtToken);
            this.Controls.Add(this.lblIdDeclaration);
            this.Controls.Add(this.txtIdDeclaration);
            this.Controls.Add(this.lblIdClasseur);
            this.Controls.Add(this.txtIdClasseur);
            this.Controls.Add(this.btnSaveConfig);
            this.Controls.Add(this.btnStartScan);
            this.Controls.Add(this.txtLogs);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;
            this.Name = "ScanForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Scanner de Documents - Configuration Laravel";
            this.Load += new System.EventHandler(this.ScanForm_Load_1);
            this.ResumeLayout(false);
            this.PerformLayout();
        }

        private void CheckControlsInitialization()
        {
            if (txtLogs == null) throw new Exception("txtLogs non initialisé");
            if (txtApiUrl == null) throw new Exception("txtApiUrl non initialisé");
            if (txtToken == null) throw new Exception("txtToken non initialisé");
            if (txtIdDeclaration == null) throw new Exception("txtIdDeclaration non initialisé");
            if (txtIdClasseur == null) throw new Exception("txtIdClasseur non initialisé");
            if (btnSaveConfig == null) throw new Exception("btnSaveConfig non initialisé");
            if (btnStartScan == null) throw new Exception("btnStartScan non initialisé");
        }

        private void InitializeForm()
        {
            Directory.CreateDirectory(tempFolder);

            this.btnSaveConfig.Click += BtnSaveConfig_Click;
            this.btnStartScan.Click += BtnStartScan_Click;
            this.Load += ScanForm_Load;
            this.FormClosing += ScanForm_FormClosing;

            SafeLog("?? Application scanner Windows démarrée");
            SafeLog($"?? Dossier temporaire: {tempFolder}");
            SafeLog("?? Prêt à recevoir les commandes...");
        }

        private void ScanForm_Load(object sender, EventArgs e)
        {
            SafeLog("? Interface utilisateur chargée");
            SafeLog("?? Initialisation complète terminée");
        }

        private void ScanForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            if (isScanning)
            {
                var result = MessageBox.Show(
                    "Un scan est en cours. Voulez-vous vraiment quitter ?",
                    "Scan en cours",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Warning);

                if (result == DialogResult.No)
                {
                    e.Cancel = true;
                }
                else
                {
                    SafeLog("?? Application fermée par l'utilisateur");
                }
            }
            else
            {
                SafeLog("?? Application fermée");
            }
        }

        private void SafeLog(string message)
        {
            try
            {
                if (txtLogs.InvokeRequired)
                {
                    txtLogs.Invoke(new Action<string>(SafeLog), message);
                    return;
                }

                string logMessage = $"{DateTime.Now:HH:mm:ss} - {message}\r\n";
                txtLogs.AppendText(logMessage);
                txtLogs.ScrollToCaret();

                OnLog?.Invoke(logMessage);
                Console.WriteLine(logMessage.Trim());
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur log: {ex.Message}");
                Console.WriteLine($"Message à logger: {message}");
            }
        }

        private void LoadConfiguration()
        {
            try
            {
                if (File.Exists(configFile))
                {
                    var configJson = File.ReadAllText(configFile);
                    var config = JsonConvert.DeserializeObject<ScannerConfig>(configJson);

                    if (config != null)
                    {
                        if (txtApiUrl.InvokeRequired)
                        {
                            txtApiUrl.Invoke(new Action(() => {
                                txtApiUrl.Text = config.ApiUrl ?? "";
                                txtToken.Text = config.Token ?? "";
                                txtIdDeclaration.Text = config.IdDeclaration?.ToString() ?? "";
                                txtIdClasseur.Text = config.IdClasseur?.ToString() ?? "";
                            }));
                        }
                        else
                        {
                            txtApiUrl.Text = config.ApiUrl ?? "";
                            txtToken.Text = config.Token ?? "";
                            txtIdDeclaration.Text = config.IdDeclaration?.ToString() ?? "";
                            txtIdClasseur.Text = config.IdClasseur?.ToString() ?? "";
                        }

                        UpdateApiConfiguration();
                        SafeLog("? Configuration chargée depuis le fichier");
                    }
                }
                else
                {
                    SafeLog("?? Aucun fichier de configuration trouvé, utilisation des valeurs par défaut");
                }
            }
            catch (Exception ex)
            {
                SafeLog($"?? Erreur chargement configuration: {ex.Message}");
            }
        }

        private void BtnSaveConfig_Click(object sender, EventArgs e)
        {
            try
            {
                if (string.IsNullOrEmpty(txtApiUrl.Text))
                {
                    MessageBox.Show("L'URL de l'API est requise", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }

                if (!Uri.TryCreate(txtApiUrl.Text, UriKind.Absolute, out _))
                {
                    MessageBox.Show("URL invalide", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }

                UpdateApiConfiguration();

                var config = new ScannerConfig
                {
                    ApiUrl = txtApiUrl.Text.Trim(),
                    Token = txtToken.Text,
                    IdDeclaration = idDeclaration,
                    IdClasseur = idClasseur,
                    nom_fichier = nom_fichier
                };

                string json = JsonConvert.SerializeObject(config, Formatting.Indented);
                File.WriteAllText(configFile, json);

                SafeLog("? Configuration sauvegardée avec succès");
                MessageBox.Show("Configuration sauvegardée !", "Succès", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                SafeLog($"? Erreur sauvegarde configuration: {ex.Message}");
                MessageBox.Show($"Erreur: {ex.Message}", "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void UpdateApiConfiguration()
        {
            try
            {
                laravelApiBase = txtApiUrl.Text.Trim();

                string normalizedUrl = laravelApiBase.TrimEnd('/');
                if (!normalizedUrl.EndsWith("/api", StringComparison.OrdinalIgnoreCase))
                {
                    normalizedUrl = normalizedUrl + "/api";
                }
                string endpointPath = uploadType == "note"
                    ? "/notes/upload-raw"
                    : "/documents-declaration/upload-raw";
                laravelApiUrl = normalizedUrl + endpointPath;

                token = txtToken.Text;

                if (int.TryParse(txtIdDeclaration.Text, out int idDec))
                    idDeclaration = idDec;
                else
                    idDeclaration = null;

                if (int.TryParse(txtIdClasseur.Text, out int idClas))
                    idClasseur = idClas;
                else
                    idClasseur = null;

                SafeLog($"?? Configuration mise à jour - URL complète: {laravelApiUrl}");
            }
            catch (Exception ex)
            {
                SafeLog($"?? Erreur mise à jour configuration: {ex.Message}");
            }
        }

        public void StartScan()
        {
            if (isScanning)
            {
                SafeLog("?? Un scan est déjà en cours");
                return;
            }

            if (string.IsNullOrEmpty(token))
            {
                SafeLog("? Token d'authentification manquant");
                OnScanComplete?.Invoke(null, false);
                return;
            }

            if (!idDeclaration.HasValue)
            {
                SafeLog("? ID de déclaration manquant");
                OnScanComplete?.Invoke(null, false);
                return;
            }

            if (!idClasseur.HasValue)
            {
                SafeLog("? ID du classeur manquant");
                OnScanComplete?.Invoke(null, false);
                return;
            }

            SafeLog($"?? Démarrage scan pour déclaration #{idDeclaration}, classeur #{idClasseur}");

            Thread scanThread = new Thread(new ThreadStart(ScanAndUpload));
            scanThread.SetApartmentState(ApartmentState.STA);
            scanThread.IsBackground = true;
            scanThread.Start();
        }

        private void BtnStartScan_Click(object sender, EventArgs e)
        {
            StartScan();
        }

        private void ScanAndUpload()
        {
            try
            {
                isScanning = true;
                scannedImages.Clear();

                var deviceManager = new DeviceManager();
                Device scanner = null;

                SafeLog("?? Recherche du scanner...");
                for (int i = 1; i <= deviceManager.DeviceInfos.Count; i++)
                {
                    var info = deviceManager.DeviceInfos[i];
                    string devName = "";
                    try { devName = info.Properties["Name"].get_Value()?.ToString() ?? ""; } catch { }

                    bool isScannerType = info.Type == WiaDeviceType.ScannerDeviceType;
                    bool looksLikeScanner =
                        devName.IndexOf("scan", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        devName.IndexOf("laserjet", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        devName.IndexOf("mfp", StringComparison.OrdinalIgnoreCase) >= 0;

                    SafeLog($"   • Périphérique WIA [{i}] Type={info.Type} Nom='{devName}'");

                    // Accepte le type Scanner classique ET les pilotes eSCL/USB
                    // (HP récents) qui remontent en Type=65535 (non spécifié).
                    if (isScannerType || looksLikeScanner)
                    {
                        scanner = info.Connect();
                        SafeLog($"? Scanner trouvé: {devName}");
                        break;
                    }
                }

                if (scanner == null)
                {
                    SafeLog("? Aucun scanner détecté !");
                    OnScanComplete?.Invoke(null, false);
                    isScanning = false;
                    return;
                }

                int page = 1;
                bool hasMorePages = true;
                string lastSignature = null;

                while (hasMorePages && isScanning)
                {
                    try
                    {
                        ImageFile image = null;
                        Exception transferError = null;
                        var transferDone = new ManualResetEvent(false);
                        bool feederEmpty = false;
                        string fileName = $"page_{page}_{DateTime.Now:yyyyMMdd_HHmmss}.jpg";
                        string path = Path.Combine(tempFolder, fileName);

                        var transferThread = new Thread(() =>
                        {
                            try
                            {
                                // Connexion WIA creee DANS ce thread (evite l'erreur RCW)
                                var dm = new DeviceManager();
                                Device dev = null;
                                for (int i = 1; i <= dm.DeviceInfos.Count; i++)
                                {
                                    var info = dm.DeviceInfos[i];
                                    string nm = "";
                                    try { nm = info.Properties["Name"].get_Value()?.ToString() ?? ""; } catch { }
                                    if (info.Type == WiaDeviceType.ScannerDeviceType ||
                                        nm.IndexOf("scan", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                        nm.IndexOf("laserjet", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                        nm.IndexOf("mfp", StringComparison.OrdinalIgnoreCase) >= 0)
                                    {
                                        dev = info.Connect();
                                        break;
                                    }
                                }
                                if (dev == null) throw new Exception("Scanner non disponible");

                                // Fin du chargeur ? (propriete DEVICE) - evite de scanner sans fin
                                if (page > 1)
                                {
                                    var hs = GetWiaProperty(dev.Properties, "Document Handling Status");
                                    if (hs == null) hs = GetWiaPropertyById(dev.Properties, 3087);
                                    int hv = 0;
                                    if (hs != null) int.TryParse(hs.ToString(), out hv);
                                    SafeLog("   - Status chargeur = " + (hs == null ? "null" : hs.ToString()));
                                    if (hs != null && (hv & 1) == 1) { feederEmpty = true; return; }
                                }

                                var item = dev.Items[1];
                                SetWiaProperty(item.Properties, "Document Handling Select", 1);
                                SetWiaProperty(item.Properties, "Pages", 1);
                                SetWiaProperty(item.Properties, "X Resolution", 200);
                                SetWiaProperty(item.Properties, "Y Resolution", 200);
                                SetWiaProperty(item.Properties, "Horizontal Resolution", 200);
                                SetWiaProperty(item.Properties, "Vertical Resolution", 200);

                                var dialog = new WIA.CommonDialog();
                                image = (ImageFile)dialog.ShowTransfer(
                                    item, "{B96B3CA1-0728-11D3-9D7B-0000F81EF32E}", false);

                                if (image != null)
                                {
                                    Directory.CreateDirectory(tempFolder);
                                    if (File.Exists(path)) File.Delete(path);
                                    image.SaveFile(path);
                                }
                            }
                            catch (Exception tex) { transferError = tex; }
                            finally { transferDone.Set(); }
                        });
                        transferThread.SetApartmentState(ApartmentState.STA);
                        transferThread.IsBackground = true;
                        transferThread.Start();

                        // Attente max : 60s pour la 1re page, 12s ensuite
                        int waitMs = page == 1 ? 60000 : 12000;
                        if (!transferDone.WaitOne(waitMs))
                        {
                            SafeLog("Fin du chargeur (aucune page supplementaire).");
                            hasMorePages = false;
                            break;
                        }

                        if (transferError != null)
                        {
                            hasMorePages = false;
                            SafeLog("Fin/erreur chargeur: " + transferError.Message);
                            break;
                        }

                        if (feederEmpty)
                        {
                            hasMorePages = false;
                            SafeLog("Chargeur vide, arret du scan.");
                            break;
                        }

                        if (image != null && File.Exists(path))
                        {
                            string sig = ComputeSignature(path);
                            if (page > 1 && lastSignature != null && sig != null && sig == lastSignature)
                            {
                                try { File.Delete(path); } catch { }
                                hasMorePages = false;
                                SafeLog("Page identique a la precedente -> fin du chargeur.");
                                break;
                            }
                            lastSignature = sig;
                            scannedImages.Add(path);
                            SafeLog($"?? Page {page} scannée: {fileName}");
                        }
                        else
                        {
                            hasMorePages = false;
                            SafeLog("Aucun document detecte dans le chargeur");
                        }
                    }
                    catch (Exception ex)
                    {
                        if (ex.Message.Contains("There are no more pages"))
                        {
                            hasMorePages = false;
                            SafeLog("? Fin des documents dans le chargeur");
                        }
                        else
                        {
                            hasMorePages = false;
                            SafeLog($"? Erreur scan: {ex.Message}");
                        }
                    }

                    page++;
                    if (page > 30) { SafeLog("Limite de 30 pages atteinte, arret."); hasMorePages = false; }
                    Thread.Sleep(800);
                }

                // Si rien dans le chargeur, tenter la vitre (flatbed)
                if (scannedImages.Count == 0 && isScanning)
                {
                    SafeLog("Aucune page dans le chargeur, tentative sur la vitre...");
                    ImageFile flatImage = null;
                    Exception flatError = null;
                    var flatDone = new ManualResetEvent(false);
                    string flatName = "flat_" + DateTime.Now.ToString("yyyyMMdd_HHmmss") + ".jpg";
                    string flatPath = Path.Combine(tempFolder, flatName);

                    var flatThread = new Thread(() =>
                    {
                        try
                        {
                            var dm = new DeviceManager();
                            Device dev = null;
                            for (int i = 1; i <= dm.DeviceInfos.Count; i++)
                            {
                                var info = dm.DeviceInfos[i];
                                string nm = "";
                                try { nm = info.Properties["Name"].get_Value()?.ToString() ?? ""; } catch { }
                                if (info.Type == WiaDeviceType.ScannerDeviceType ||
                                    nm.IndexOf("scan", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                    nm.IndexOf("laserjet", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                    nm.IndexOf("mfp", StringComparison.OrdinalIgnoreCase) >= 0)
                                {
                                    dev = info.Connect();
                                    break;
                                }
                            }
                            if (dev == null) throw new Exception("Scanner non disponible");

                            var flatItem = dev.Items[1];
                            SetWiaProperty(flatItem.Properties, "Document Handling Select", 2);
                            var flatDialog = new WIA.CommonDialog();
                            flatImage = (ImageFile)flatDialog.ShowTransfer(
                                flatItem, "{B96B3CA1-0728-11D3-9D7B-0000F81EF32E}", false);
                            if (flatImage != null)
                            {
                                Directory.CreateDirectory(tempFolder);
                                if (File.Exists(flatPath)) File.Delete(flatPath);
                                flatImage.SaveFile(flatPath);
                            }
                        }
                        catch (Exception ex) { flatError = ex; }
                        finally { flatDone.Set(); }
                    });
                    flatThread.SetApartmentState(ApartmentState.STA);
                    flatThread.IsBackground = true;
                    flatThread.Start();

                    if (flatDone.WaitOne(60000) && flatError == null && flatImage != null && File.Exists(flatPath))
                    {
                        scannedImages.Add(flatPath);
                        SafeLog("Page (vitre) scannee: " + flatName);
                    }
                    else if (flatError != null)
                    {
                        SafeLog("Erreur scan vitre: " + flatError.Message);
                    }
                    else
                    {
                        SafeLog("Aucun document detecte sur la vitre");
                    }
                }

                SafeLog($"?? Total: {scannedImages.Count} page(s) scannée(s)");

                if (scannedImages.Count > 0 && isScanning)
                {
                    string pdfPath = CreatePdf();
                    if (!string.IsNullOrEmpty(pdfPath) && isScanning)
                    {
                        bool uploadSuccess = UploadToLaravel(pdfPath);
                        if (uploadSuccess)
                        {
                            SafeLog("?? PDF uploadé avec succès vers Laravel !");
                            OnScanComplete?.Invoke(pdfPath, true);
                        }
                        else
                        {
                            SafeLog("? Échec de l'upload vers Laravel");
                            OnScanComplete?.Invoke(pdfPath, false);
                        }

                        CleanTempFiles();
                    }
                }
                else if (scannedImages.Count == 0)
                {
                    OnScanComplete?.Invoke(null, false);
                }
            }
            catch (Exception ex)
            {
                SafeLog($"?? Erreur critique: {ex.Message}");
                OnScanComplete?.Invoke(null, false);
            }
            finally
            {
                isScanning = false;
            }
        }

        private bool UploadToLaravel(string pdfPath)
        {
            try
            {
                if (!File.Exists(pdfPath))
                {
                    SafeLog("? Fichier PDF introuvable");
                    return false;
                }

                FileInfo fileInfo = new FileInfo(pdfPath);
                SafeLog($"?? Envoi vers Laravel: {fileInfo.Name} ({fileInfo.Length / 1024} KB)");

                byte[] fileBytes = File.ReadAllBytes(pdfPath);
                    string uploadName = ToAscii(Path.GetFileNameWithoutExtension(pdfPath)) + ".pdf";

                    string postUrl = laravelApiUrl;
                    if (uploadType == "note")
                    {
                        postUrl += "?id_note_perception=" + idDeclaration.Value
                                 + "&id_classeur=" + idClasseur.Value
                                 + "&id_ministere=" + idMinistere
                                 + "&nom_fichier=" + Uri.EscapeDataString(uploadName);
                    }
                    else
                    {
                        postUrl += "?id_declaration=" + idDeclaration.Value
                                 + "&id_classeur=" + idClasseur.Value
                                 + "&nom_fichier=" + Uri.EscapeDataString(uploadName);
                    }

                    using (var client = new HttpClient())
                    {
                        var fileContent = new ByteArrayContent(fileBytes);
                        fileContent.Headers.ContentType =
                            System.Net.Http.Headers.MediaTypeHeaderValue.Parse("application/pdf");

                        client.DefaultRequestHeaders.Authorization =
                            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                        client.Timeout = TimeSpan.FromMinutes(5);

                        SafeLog("Envoi POST (raw) a: " + postUrl);
                        var response = client.PostAsync(postUrl, fileContent).Result;

                    if (response.IsSuccessStatusCode)
                    {
                        var responseContent = response.Content.ReadAsStringAsync().Result;
                        SafeLog($"? Réponse API: {responseContent}");

                        try
                        {
                            var result = JsonConvert.DeserializeObject<dynamic>(responseContent);
                            if (result.message != null)
                            {
                                SafeLog($"?? Message: {result.message}");
                            }
                            return true;
                        }
                        catch (JsonException)
                        {
                            return true;
                        }
                    }
                    else
                    {
                        var errorContent = response.Content.ReadAsStringAsync().Result;
                        SafeLog($"? Erreur HTTP {response.StatusCode}: {errorContent}");

                        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                        {
                            MessageBox.Show("Token d'authentification invalide ou expiré", "Erreur d'authentification",
                                MessageBoxButtons.OK, MessageBoxIcon.Error);
                        }

                        return false;
                    }
                }
            }
            catch (Exception ex)
            {
                SafeLog($"? Erreur upload: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Crée un PDF à partir des images scannées avec suppression agressive des bords noirs
        /// </summary>
        private string CreatePdf()
        {
            try
            {
                if (scannedImages.Count == 0)
                    return null;

                string safeFileName = string.IsNullOrEmpty(nom_fichier) ? "scan" : SanitizeFileName(nom_fichier);
                string outputFileName = $"{safeFileName}_{idDeclaration}_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";
                string outputPath = Path.Combine(tempFolder, outputFileName);

                SafeLog($"?? Création du PDF: {outputFileName}");

                using (var stream = new FileStream(outputPath, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    // Document sans aucune marge
                    var pdfDoc = new Document(PageSize.A4, 0, 0, 0, 0);
                    var writer = PdfWriter.GetInstance(pdfDoc, stream);
                    pdfDoc.Open();

                    for (int i = 0; i < scannedImages.Count; i++)
                    {
                        string imgPath = scannedImages[i];

                        if (File.Exists(imgPath))
                        {
                            SafeLog($"   ?? Traitement image {i + 1}/{scannedImages.Count}: {Path.GetFileName(imgPath)}");

                            // Supprimer COMPLÈTEMENT tous les bords noirs
                            string processedImagePath = RemoveAllBlackBorders(imgPath);

                            try
                            {
                                var img = iTextSharp.text.Image.GetInstance(processedImagePath);

                                // FORCER l'image à remplir exactement toute la page A4
                                img.ScaleAbsolute(pdfDoc.PageSize.Width, pdfDoc.PageSize.Height);

                                // Positionner à (0,0) pour coller aux bords
                                img.SetAbsolutePosition(0, 0);

                                pdfDoc.Add(img);

                                if (i < scannedImages.Count - 1)
                                {
                                    pdfDoc.NewPage();
                                }
                            }
                            finally
                            {
                                if (processedImagePath != imgPath && File.Exists(processedImagePath))
                                {
                                    try { File.Delete(processedImagePath); } catch { }
                                }
                            }
                        }
                    }

                    pdfDoc.Close();
                    SafeLog($"? PDF créé avec succès: {outputFileName}");
                }

                return outputPath;
            }
            catch (Exception ex)
            {
                SafeLog($"? Erreur création PDF: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Supprime TOUS les bords noirs de l'image de manière agressive
        /// </summary>
        private string RemoveAllBlackBorders(string originalImagePath)
        {
            try
            {
                string tempFile = Path.Combine(tempFolder, $"cropped_{Guid.NewGuid():N}.jpg");

                using (var bitmap = new Bitmap(originalImagePath))
                {
                    // Supprimer les bords noirs de façon agressive
                    using (var croppedBitmap = AggressiveAutoCrop(bitmap))
                    {
                        // Sauvegarder au format PNG sans perte
                        SaveCompressed(croppedBitmap, tempFile);
                    }
                }

                return tempFile;
            }
            catch (Exception ex)
            {
                SafeLog($"?? Erreur suppression agressive: {ex.Message}");
                return originalImagePath;
            }
        }

        /// <summary>
        /// Rogne l'image de façon agressive pour enlever TOUT le noir autour
        /// </summary>
        private Bitmap AggressiveAutoCrop(Bitmap original)
        {
            try
            {
                // Seuil très bas pour détecter même les pixels légèrement gris
                int threshold = 10; // Presque noir uniquement

                System.Drawing.Rectangle cropRect = FindExactContentRectangleFast(original, threshold);

                // Vérifier que le rectangle est valide
                if (cropRect.Width <= 0 || cropRect.Height <= 0 ||
                    cropRect.Width > original.Width || cropRect.Height > original.Height)
                {
                    return new Bitmap(original);
                }

                SafeLog($"   ?? Rectangle de contenu: X={cropRect.X}, Y={cropRect.Y}, Largeur={cropRect.Width}, Hauteur={cropRect.Height}");

                // PAS de marge - on veut exactement le contenu
                var cropped = new Bitmap(cropRect.Width, cropRect.Height);

                using (Graphics g = Graphics.FromImage(cropped))
                {
                    g.CompositingQuality = CompositingQuality.HighQuality;
                    g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                    g.SmoothingMode = SmoothingMode.HighQuality;
                    g.PixelOffsetMode = PixelOffsetMode.HighQuality;

                    g.DrawImage(original,
                        new System.Drawing.Rectangle(0, 0, cropRect.Width, cropRect.Height),
                        cropRect,
                        GraphicsUnit.Pixel);
                }

                SafeLog($"? Cadre noir supprimé: nouvelle taille {cropRect.Width}x{cropRect.Height}");
                return cropped;
            }
            catch (Exception ex)
            {
                SafeLog($"?? Erreur auto-crop agressif: {ex.Message}");
                return new Bitmap(original);
            }
        }

        /// <summary>
        /// Trouve le rectangle EXACT contenant le contenu (non noir) de l'image
        /// </summary>
        private System.Drawing.Rectangle FindExactContentRectangleFast(Bitmap bitmap, int threshold)
        {
            int width = bitmap.Width;
            int height = bitmap.Height;
            var rect = new System.Drawing.Rectangle(0, 0, width, height);
            var data = bitmap.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
            try
            {
                int stride = data.Stride;
                int bytes = stride * height;
                byte[] buffer = new byte[bytes];
                Marshal.Copy(data.Scan0, buffer, 0, bytes);

                int left = width, right = 0, top = height, bottom = 0;
                bool contentFound = false;
                for (int y = 0; y < height; y++)
                {
                    int row = y * stride;
                    for (int x = 0; x < width; x++)
                    {
                        int idx = row + x * 3;
                        byte b = buffer[idx];
                        byte g = buffer[idx + 1];
                        byte r = buffer[idx + 2];
                        bool isBlack = r < threshold && g < threshold && b < threshold;
                        if (!isBlack)
                        {
                            contentFound = true;
                            if (x < left) left = x;
                            if (x > right) right = x;
                            if (y < top) top = y;
                            if (y > bottom) bottom = y;
                        }
                    }
                }
                if (!contentFound) return rect;
                return new System.Drawing.Rectangle(left, top, right - left + 1, bottom - top + 1);
            }
            finally { bitmap.UnlockBits(data); }
        }

        private System.Drawing.Rectangle FindExactContentRectangle(Bitmap bitmap, int threshold)
        {
            int left = bitmap.Width;
            int right = 0;
            int top = bitmap.Height;
            int bottom = 0;

            bool contentFound = false;

            // Scanner TOUS les pixels pour être précis (pas d'échantillonnage)
            for (int y = 0; y < bitmap.Height; y++)
            {
                for (int x = 0; x < bitmap.Width; x++)
                {
                    Color pixel = bitmap.GetPixel(x, y);

                    // Vérifier si le pixel n'est PAS noir (fait partie du document)
                    // Un pixel est considéré comme noir si toutes ses composantes sont sous le seuil
                    bool isBlack = pixel.R < threshold && pixel.G < threshold && pixel.B < threshold;

                    if (!isBlack)
                    {
                        contentFound = true;

                        if (x < left) left = x;
                        if (x > right) right = x;
                        if (y < top) top = y;
                        if (y > bottom) bottom = y;
                    }
                }
            }

            // Si aucun contenu trouvé, retourner l'image entière
            if (!contentFound)
            {
                return new System.Drawing.Rectangle(0, 0, bitmap.Width, bitmap.Height);
            }

            return new System.Drawing.Rectangle(
                left,
                top,
                right - left + 1,
                bottom - top + 1
            );
        }

        /// <summary>
        /// Nettoie le nom de fichier pour éviter les caractères invalides
        /// </summary>
        private string ToAscii(string input)
        {
            if (string.IsNullOrEmpty(input)) return input ?? "";
            // Decompose les accents (e -> e + accent) puis retire les accents
            var normalized = input.Normalize(System.Text.NormalizationForm.FormD);
            var sb = new System.Text.StringBuilder();
            foreach (char c in normalized)
            {
                if (System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c)
                    != System.Globalization.UnicodeCategory.NonSpacingMark)
                {
                    sb.Append(c);
                }
            }
            var ascii = sb.ToString().Normalize(System.Text.NormalizationForm.FormC);
            // Retire apostrophes et guillemets (caracteres "bizarres")
            ascii = ascii.Replace("'", "").Replace("\u2019", "").Replace("\"", "").Replace("`", "");
            // Remplace tout autre caractere non autorise par _
            ascii = System.Text.RegularExpressions.Regex.Replace(ascii, @"[^\w\-. ]", "_");
            // Espaces -> _ puis fusionne les _ multiples
            ascii = System.Text.RegularExpressions.Regex.Replace(ascii, @"\s+", "_");
            ascii = System.Text.RegularExpressions.Regex.Replace(ascii, @"_{2,}", "_");
            return ascii.Trim('_', '.', ' ');
        }

        private void SaveCompressed(Bitmap bitmap, string path)
        {
            // Reduit la resolution (max 2000 px de large) et enregistre en JPEG q72
            // pour alleger fortement le PDF.
            int maxWidth = 2000;
            Bitmap final = bitmap;
            if (bitmap.Width > maxWidth)
            {
                int newHeight = (int)(bitmap.Height * (maxWidth / (double)bitmap.Width));
                final = new Bitmap(bitmap, maxWidth, newHeight);
            }

            ImageCodecInfo jpeg = null;
            foreach (var codec in ImageCodecInfo.GetImageEncoders())
            {
                if (codec.FormatID == ImageFormat.Jpeg.Guid) { jpeg = codec; break; }
            }

            var encParams = new EncoderParameters(1);
            encParams.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, 72L);

            if (jpeg != null) final.Save(path, jpeg, encParams);
            else final.Save(path, ImageFormat.Jpeg);

            if (!ReferenceEquals(final, bitmap)) final.Dispose();
        }

        private string ComputeSignature(string path)
        {
            // Empreinte grossiere 8x8 (niveaux de gris) pour detecter une page
            // identique a la precedente (page fantome quand le chargeur est vide).
            try
            {
                using (var bmp = new Bitmap(path))
                using (var small = new Bitmap(bmp, new Size(8, 8)))
                {
                    var sb = new System.Text.StringBuilder();
                    for (int y = 0; y < 8; y++)
                    {
                        for (int x = 0; x < 8; x++)
                        {
                            var c = small.GetPixel(x, y);
                            int g = (c.R + c.G + c.B) / 3;
                            sb.Append((char)('A' + (g / 16)));
                        }
                    }
                    return sb.ToString();
                }
            }
            catch { return null; }
        }

        private string SanitizeFileName(string fileName)
        {
            if (string.IsNullOrEmpty(fileName))
                return "scan";

            char[] invalidChars = Path.GetInvalidFileNameChars();
            foreach (char c in invalidChars)
            {
                fileName = fileName.Replace(c, '_');
            }

            fileName = fileName.Replace(' ', '_');

            if (fileName.Length > 50)
                fileName = fileName.Substring(0, 50);

            return fileName.Trim();
        }

        private void CleanTempFiles()
        {
            try
            {
                foreach (var file in scannedImages)
                {
                    if (File.Exists(file))
                        File.Delete(file);
                }

                var pdfFiles = Directory.GetFiles(tempFolder, "*.pdf");
                foreach (var pdfFile in pdfFiles)
                {
                    var fileInfo = new FileInfo(pdfFile);
                    if (fileInfo.LastWriteTime < DateTime.Now.AddHours(-1))
                    {
                        File.Delete(pdfFile);
                    }
                }

                // Nettoyer aussi les images traitées
                var processedFiles = Directory.GetFiles(tempFolder, "cropped_aggressive_*.png");
                foreach (var file in processedFiles)
                {
                    try { File.Delete(file); } catch { }
                }

                scannedImages.Clear();
                SafeLog("?? Fichiers temporaires nettoyés");
            }
            catch (Exception ex)
            {
                SafeLog($"?? Erreur nettoyage: {ex.Message}");
            }
        }

        private object GetWiaProperty(IProperties properties, string name)
        {
            try
            {
                foreach (Property p in properties)
                {
                    if (p.Name == name) return p.get_Value();
                }
            }
            catch { }
            return null;
        }

        private object GetWiaPropertyById(IProperties properties, int id)
        {
            try
            {
                foreach (Property p in properties)
                {
                    try { if (Convert.ToInt32(p.PropertyID) == id) return p.get_Value(); } catch { }
                }
            }
            catch { }
            return null;
        }

        private void SetWiaProperty(IProperties properties, object propName, object value)
        {
            try
            {
                Property prop = null;
                foreach (Property p in properties)
                {
                    if (p.PropertyID.Equals(propName) || p.Name == propName.ToString())
                    {
                        prop = p;
                        break;
                    }
                }

                if (prop != null)
                    prop.set_Value(value);
            }
            catch { }
        }

        public void SetDocumentInfo(int declarationId, int classeurId, string authToken, string nomFichier = null, string uploadTypeParam = "document", int idMinistereParam = 0)
        {
            if (txtIdDeclaration.InvokeRequired)
            {
                txtIdDeclaration.Invoke(new Action(() =>
                {
                    txtIdDeclaration.Text = declarationId.ToString();
                    txtIdClasseur.Text = classeurId.ToString();
                    txtToken.Text = authToken;
                    nom_fichier = nomFichier;
                    uploadType = uploadTypeParam;
                    idMinistere = idMinistereParam;
                    UpdateApiConfiguration();
                    SafeLog($"?? Infos document reçues: Déclaration={declarationId}, Classeur={classeurId}");
                }));
            }
            else
            {
                txtIdDeclaration.Text = declarationId.ToString();
                txtIdClasseur.Text = classeurId.ToString();
                txtToken.Text = authToken;
                nom_fichier = nomFichier;
                uploadType = uploadTypeParam;
                idMinistere = idMinistereParam;
                UpdateApiConfiguration();
                SafeLog($"?? Infos document reçues: Déclaration={declarationId}, Classeur={classeurId}");
            }
        }

        public void SetApiUrl(string apiUrl)
        {
            if (txtApiUrl.InvokeRequired)
            {
                txtApiUrl.Invoke(new Action(() =>
                {
                    txtApiUrl.Text = apiUrl;
                    UpdateApiConfiguration();
                    SafeLog($"?? URL API mise à jour: {apiUrl}");
                }));
            }
            else
            {
                txtApiUrl.Text = apiUrl;
                UpdateApiConfiguration();
                SafeLog($"?? URL API mise à jour: {apiUrl}");
            }
        }

        public bool IsScanningActive => isScanning;

        /// <summary>
        /// Indique si un scanner WIA est réellement disponible (type Scanner
        /// classique ou pilote eSCL/USB HP remonté en type non spécifié).
        /// </summary>
        public bool IsScannerAvailable()
        {
            try
            {
                var deviceManager = new DeviceManager();
                for (int i = 1; i <= deviceManager.DeviceInfos.Count; i++)
                {
                    var info = deviceManager.DeviceInfos[i];
                    string name = "";
                    try { name = info.Properties["Name"].get_Value()?.ToString() ?? ""; } catch { }

                    bool isScannerType = info.Type == WiaDeviceType.ScannerDeviceType;
                    bool looksLikeScanner =
                        name.IndexOf("scan", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        name.IndexOf("laserjet", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        name.IndexOf("mfp", StringComparison.OrdinalIgnoreCase) >= 0;

                    if (isScannerType || looksLikeScanner) return true;
                }
            }
            catch { }
            return false;
        }

        private void ScanForm_Load_1(object sender, EventArgs e)
        {
        }
    }

    public class ScannerConfig
    {
        public string ApiUrl { get; set; }
        public string Token { get; set; }
        public int? IdDeclaration { get; set; }
        public int? IdClasseur { get; set; }
        public string nom_fichier { get; set; }
    }

    public class JavaScriptExposedObject
    {
        private ScanForm _form;
        public JavaScriptExposedObject(ScanForm form) => _form = form;
        public void StartScan() => _form.StartScan();
        public void SetDocumentInfo(int declarationId, int classeurId, string authToken, string nomFichier = null)
            => _form.SetDocumentInfo(declarationId, classeurId, authToken, nomFichier);
        public void SetApiUrl(string apiUrl) => _form.SetApiUrl(apiUrl);
        public bool IsScanningActive => _form.IsScanningActive;
    }

    public static class GlobalScanner
    {
        public static ScanForm Instance { get; set; }
        public static void StartScan() => Instance?.StartScan();
        public static void SetDocumentInfo(int declarationId, int classeurId, string authToken, string nomFichier = null)
            => Instance?.SetDocumentInfo(declarationId, classeurId, authToken, nomFichier);
        public static void SetApiUrl(string apiUrl) => Instance?.SetApiUrl(apiUrl);
        public static bool IsScanningActive => Instance?.IsScanningActive ?? false;
    }
}