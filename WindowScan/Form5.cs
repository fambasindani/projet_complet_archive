using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Windows.Forms;
using iTextSharp.text;
using iTextSharp.text.pdf;
using WIA;

namespace WindowScan
{
    public partial class Form5 : Form
    {
        private List<string> scannedImages = new List<string>();

        public Form5()
        {
            InitializeComponent();

            button1.Text = "Scanner automatiquement";
            button1.Click += Button1_Click;

            buttonCreatePdf.Text = "Créer PDF";
            buttonCreatePdf.Click += ButtonCreatePdf_Click;

            textBox1.Multiline = true;
            textBox1.ScrollBars = ScrollBars.Vertical;
        }

        private void Button1_Click(object sender, EventArgs e)
        {
            scannedImages.Clear();
            textBox1.Clear();

            Thread scanThread = new Thread(() =>
            {
                try
                {
                    var deviceManager = new DeviceManager();
                    Device scanner = null;

                    for (int i = 1; i <= deviceManager.DeviceInfos.Count; i++)
                    {
                        if (deviceManager.DeviceInfos[i].Type == WiaDeviceType.ScannerDeviceType)
                        {
                            scanner = deviceManager.DeviceInfos[i].Connect();
                            break;
                        }
                    }

                    if (scanner == null)
                        throw new Exception("Scanner WIA non détecté");

                    int page = 1;
                    bool hasMorePages = true;

                    while (hasMorePages)
                    {
                        try
                        {
                            var item = scanner.Items[1];

                            // 🔧 Forcer le chargeur (ADF) s’il est disponible
                            SetWiaProperty(item.Properties, "Document Handling Select", 1); // 1 = Feeder
                            SetWiaProperty(item.Properties, "Pages", 1);

                            // 📸 Scanner au format JPEG
                            var dialog = new WIA.CommonDialog();
                           // ImageFile image = (ImageFile)dialog.ShowTransfer(item, WIA.FormatID.wiaFormatJPEG, false);
                            ImageFile image = (ImageFile)dialog.ShowTransfer(item, "{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}", false);


                            if (image != null)
                            {
                                string folder = Path.Combine(Path.GetTempPath(), "WiaScans");
                                Directory.CreateDirectory(folder);

                                string fileName = $"page_{DateTime.Now:yyyyMMdd_HHmmss_fff}.jpg";
                                string path = Path.Combine(folder, fileName);

                                if (File.Exists(path)) File.Delete(path);
                                image.SaveFile(path);
                                scannedImages.Add(path);

                                this.Invoke(new MethodInvoker(() =>
                                {
                                    textBox1.AppendText($"✅ Scan page {page} : {fileName}\r\n");
                                }));
                            }
                            else
                            {
                                hasMorePages = false;
                                this.Invoke(new MethodInvoker(() =>
                                {
                                    MessageBox.Show("⚠️ Aucun document détecté.");
                                }));
                            }
                        }
                        catch
                        {
                            hasMorePages = false;
                            this.Invoke(new MethodInvoker(() =>
                            {
                                MessageBox.Show("🛑 Bac vide ou fin de documents.");
                            }));
                        }

                        page++;
                        Thread.Sleep(200); // pause entre les pages
                    }

                    this.Invoke(new MethodInvoker(() =>
                    {
                        textBox1.AppendText($"🗂️ Total : {scannedImages.Count} page(s) scannée(s).\r\n");
                    }));
                }
                catch (Exception ex)
                {
                    this.Invoke(new MethodInvoker(() =>
                    {
                        MessageBox.Show($"❌ Erreur : {ex.Message}");
                    }));
                }
            });

            scanThread.SetApartmentState(ApartmentState.STA);
            scanThread.Start();
        }

        private void ButtonCreatePdf_Click(object sender, EventArgs e)
        {
            if (scannedImages.Count == 0)
            {
                MessageBox.Show("⚠️ Aucun scan disponible.");
                return;
            }

            try
            {
                string outputDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "Scans");
                Directory.CreateDirectory(outputDir);

                string outputPath = Path.Combine(outputDir, $"Document_Scanné_{DateTime.Now:yyyyMMdd_HHmmss}.pdf");

                using (var stream = new FileStream(outputPath, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    var pdfDoc = new Document();
                    var writer = PdfWriter.GetInstance(pdfDoc, stream);
                    pdfDoc.Open();

                    foreach (var imgPath in scannedImages)
                    {
                        var img = iTextSharp.text.Image.GetInstance(imgPath);
                        img.ScaleToFit(pdfDoc.PageSize.Width - 50, pdfDoc.PageSize.Height - 50);
                        img.Alignment = Element.ALIGN_CENTER;
                        pdfDoc.Add(img);
                        pdfDoc.NewPage();
                    }

                    pdfDoc.Close();
                }

                MessageBox.Show($"📄 PDF créé avec succès : {outputPath}");
                scannedImages.Clear();
                textBox1.AppendText("✅ Liste des scans vidée.\r\n");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"❌ Erreur création PDF : {ex.Message}");
            }
        }

        // 🔧 Méthode pour régler une propriété WIA
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
            catch
            {
                // On ignore les erreurs si la propriété n'existe pas
            }
        }

        private void Form5_Load(object sender, EventArgs e)
        {

        }
    }
}
