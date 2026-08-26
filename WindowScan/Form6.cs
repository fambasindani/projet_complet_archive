using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Threading;
using System.Windows.Forms;
using iTextSharp.text;
using iTextSharp.text.pdf;
using WIA;
using Newtonsoft.Json;

namespace WindowScan
{
    public partial class Form6 : Form
    {
        private List<string> scannedImages = new List<string>();
        private readonly string laravelApiUrl = "http://localhost:8000/api/documents-declaration/upload-multiple"; // CORRECTION ICI
        private readonly string tempFolder = Path.Combine(Path.GetTempPath(), "WiaScans");

        public Action<string> OnLog; // Callback pour logs
        public Action<string, bool> OnScanComplete; // Callback quand scan terminé
        private bool isScanning = false;

        public Form6()
        {
            InitializeComponent();
            InitializeForm();
        }

        private void InitializeForm()
        {
            // Configuration de l'interface
            this.Text = "Scanner de Documents - Intégration Laravel";
            this.Width = 600;
            this.Height = 400;

            // Assurer que le dossier temporaire existe
            Directory.CreateDirectory(tempFolder);
        }

        /// <summary>
        /// Démarre le scan (peut être appelé depuis React)
        /// </summary>
        public void StartScan()
        {
            if (isScanning)
            {
                Log("⚠️ Un scan est déjà en cours");
                return;
            }

            isScanning = true;
            scannedImages.Clear();
            Log("🌀 Démarrage du scan vers Laravel...");

            Thread scanThread = new Thread(new ThreadStart(ScanAndUpload));
            scanThread.SetApartmentState(ApartmentState.STA);
            scanThread.IsBackground = true;
            scanThread.Start();
        }

        /// <summary>
        /// Méthode principale de scan et upload
        /// </summary>
        private void ScanAndUpload()
        {
            try
            {
                var deviceManager = new DeviceManager();
                Device scanner = null;

                // Cherche le premier scanner WIA
                for (int i = 1; i <= deviceManager.DeviceInfos.Count; i++)
                {
                    if (deviceManager.DeviceInfos[i].Type == WiaDeviceType.ScannerDeviceType)
                    {
                        scanner = deviceManager.DeviceInfos[i].Connect();
                        break;
                    }
                }

                if (scanner == null)
                {
                    Log("❌ Aucun scanner détecté !");
                    OnScanComplete?.Invoke(null, false);
                    isScanning = false;
                    return;
                }

                int page = 1;
                bool hasMorePages = true;

                while (hasMorePages)
                {
                    try
                    {
                        var item = scanner.Items[1];

                        // ADF si disponible
                        SetWiaProperty(item.Properties, "Document Handling Select", 1);
                        SetWiaProperty(item.Properties, "Pages", 1);

                        // Format JPEG
                        var dialog = new WIA.CommonDialog();
                        ImageFile image = (ImageFile)dialog.ShowTransfer(
                            item,
                            "{B96B3CA1-0728-11D3-9D7B-0000F81EF32E}", // GUID pour JPEG
                            false
                        );

                        if (image != null)
                        {
                            Directory.CreateDirectory(tempFolder);

                            string fileName = $"page_{page}_{DateTime.Now:yyyyMMdd_HHmmss}.jpg";
                            string path = Path.Combine(tempFolder, fileName);

                            if (File.Exists(path)) File.Delete(path);
                            image.SaveFile(path);
                            scannedImages.Add(path);

                            Log($"✅ Page {page} scannée : {fileName}");
                        }
                        else
                        {
                            hasMorePages = false;
                            Log("⚠️ Aucun document détecté.");
                        }
                    }
                    catch (Exception ex)
                    {
                        if (ex.Message.Contains("There are no more pages"))
                        {
                            hasMorePages = false;
                            Log("📭 Fin des documents dans le chargeur");
                        }
                        else
                        {
                            hasMorePages = false;
                            Log($"🛑 Erreur : {ex.Message}");
                        }
                    }

                    page++;
                    Thread.Sleep(500); // Augmenté pour plus de stabilité
                }

                Log($"🗂️ Total : {scannedImages.Count} page(s) scannée(s).");

                // Création PDF et upload vers Laravel
                if (scannedImages.Count > 0)
                {
                    string pdfPath = CreatePdf();
                    if (!string.IsNullOrEmpty(pdfPath))
                    {
                        bool uploadSuccess = UploadToLaravel(pdfPath);
                        if (uploadSuccess)
                        {
                            Log("🚀 PDF uploadé avec succès vers Laravel !");
                            OnScanComplete?.Invoke(pdfPath, true);
                        }
                        else
                        {
                            Log("❌ Échec de l'upload vers Laravel");
                            OnScanComplete?.Invoke(pdfPath, false);
                        }

                        CleanTempFiles();
                    }
                }
                else
                {
                    OnScanComplete?.Invoke(null, false);
                }
            }
            catch (Exception ex)
            {
                Log($"❌ Erreur critique : {ex.Message}");
                OnScanComplete?.Invoke(null, false);
            }
            finally
            {
                isScanning = false;
            }
        }

        /// <summary>
        /// Crée le PDF à partir des images scannées
        /// </summary>
        private string CreatePdf()
        {
            try
            {
                if (scannedImages.Count == 0)
                    return null;

                string outputFileName = $"scan_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";
                string outputPath = Path.Combine(tempFolder, outputFileName);

                Log($"📄 Création du PDF : {outputFileName}");

                using (var stream = new FileStream(outputPath, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    var pdfDoc = new Document();
                    var writer = PdfWriter.GetInstance(pdfDoc, stream);
                    pdfDoc.Open();

                    foreach (var imgPath in scannedImages)
                    {
                        if (File.Exists(imgPath))
                        {
                            var img = iTextSharp.text.Image.GetInstance(imgPath);
                            img.ScaleToFit(pdfDoc.PageSize.Width - 72, pdfDoc.PageSize.Height - 72);
                            img.Alignment = Element.ALIGN_CENTER;
                            pdfDoc.Add(img);
                            pdfDoc.NewPage();
                        }
                    }

                    pdfDoc.Close();
                }

                FileInfo fileInfo = new FileInfo(outputPath);
                Log($"✅ PDF créé : {fileInfo.Name} ({fileInfo.Length / 1024} KB)");

                return outputPath;
            }
            catch (Exception ex)
            {
                Log($"❌ Erreur création PDF : {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Upload le PDF vers Laravel
        /// </summary>
        private bool UploadToLaravel(string pdfPath)
        {
            try
            {
                if (!File.Exists(pdfPath))
                {
                    Log("❌ Fichier PDF introuvable");
                    return false;
                }

                Log($"📤 Envoi vers Laravel...");

                using (var client = new HttpClient())
                using (var formData = new MultipartFormDataContent())
                {
                    // Ajouter le fichier
                    byte[] fileBytes = File.ReadAllBytes(pdfPath);
                    var fileContent = new ByteArrayContent(fileBytes);
                    fileContent.Headers.ContentType =
                        System.Net.Http.Headers.MediaTypeHeaderValue.Parse("application/pdf");

                    formData.Add(fileContent, "scan_file", Path.GetFileName(pdfPath));

                    // Ajouter des métadonnées
                    formData.Add(new StringContent(DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")), "scan_date");
                    formData.Add(new StringContent(Environment.MachineName), "scanner_source");

                    // CORRECTION : Timeout plus long
                    client.Timeout = TimeSpan.FromMinutes(5);

                    // Envoyer la requête
                    var response = client.PostAsync(laravelApiUrl, formData).Result;

                    if (response.IsSuccessStatusCode)
                    {
                        var responseContent = response.Content.ReadAsStringAsync().Result;

                        try
                        {
                            var result = JsonConvert.DeserializeObject<dynamic>(responseContent);

                            if (result.status == "success")
                            {
                                Log($"✅ Upload réussi : {result.fileUrl}");
                                return true;
                            }
                            else
                            {
                                Log($"❌ Erreur API : {result.message}");
                                return false;
                            }
                        }
                        catch (JsonException)
                        {
                            // Si la réponse n'est pas du JSON valide
                            Log($"✅ Upload réussi (réponse: {responseContent})");
                            return true;
                        }
                    }
                    else
                    {
                        var errorContent = response.Content.ReadAsStringAsync().Result;
                        Log($"❌ Erreur HTTP {response.StatusCode} : {errorContent}");
                        return false;
                    }
                }
            }
            catch (Exception ex)
            {
                Log($"❌ Erreur upload : {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Nettoie les fichiers temporaires
        /// </summary>
        private void CleanTempFiles()
        {
            try
            {
                // Supprimer les images JPG
                foreach (var file in scannedImages)
                {
                    if (File.Exists(file))
                        File.Delete(file);
                }

                // Supprimer les PDF temporaires
                var pdfFiles = Directory.GetFiles(tempFolder, "*.pdf");
                foreach (var pdfFile in pdfFiles)
                {
                    var fileInfo = new FileInfo(pdfFile);
                    if (fileInfo.LastWriteTime < DateTime.Now.AddHours(-1))
                    {
                        File.Delete(pdfFile);
                    }
                }

                scannedImages.Clear();
                Log("🧹 Fichiers temporaires nettoyés");
            }
            catch (Exception ex)
            {
                Log($"⚠️ Erreur nettoyage : {ex.Message}");
            }
        }

        /// <summary>
        /// Journalisation
        /// </summary>
        private void Log(string message)
        {
            if (textBox1.InvokeRequired)
            {
                textBox1.Invoke(new Action<string>(Log), message);
            }
            else
            {
                string logMessage = $"{DateTime.Now:HH:mm:ss} - {message}\r\n";
                textBox1.AppendText(logMessage);
                textBox1.ScrollToCaret();
                OnLog?.Invoke(logMessage);
            }
        }

        /// <summary>
        /// Configure une propriété WIA
        /// </summary>
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

        public bool IsScanningActive => isScanning;

        private void Form6_Load(object sender, EventArgs e)
        {

        }
    }
}