using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using iTextSharp.text;
using iTextSharp.text.pdf;
using WIA;

namespace WindowScan
{
    public partial class Form4 : Form
    {
        private List<string> scannedImages = new List<string>();

        public Form4()
        {
            InitializeComponent();

            // Configurer les boutons
            button1.Text = "Scanner pages";
            button1.Click += button1_Click;

            button2.Text = "Créer PDF";
            button2.Click += button2_Click;

            textBox1.Multiline = true;
            textBox1.ScrollBars = ScrollBars.Vertical;
        }

        private void Form4_Load(object sender, EventArgs e) { }

        private Device GetScanner()
        {
            DeviceManager manager = new DeviceManager();
            for (int i = 1; i <= manager.DeviceInfos.Count; i++)
            {
                if (manager.DeviceInfos[i].Type == WiaDeviceType.ScannerDeviceType)
                {
                    return manager.DeviceInfos[i].Connect();
                }
            }
            return null;
        }

        private void ScanMultiplePages()
        {
            bool continuer = true;
            int pageNumber = 1;

            while (continuer)
            {
                try
                {
                    // 🔁 Reconnecter le scanner à chaque boucle
                    Device scanner = GetScanner();
                    if (scanner == null)
                        throw new Exception("Scanner WIA non détecté");

                    Item item = scanner.Items[1];
                    ImageFile image = (ImageFile)item.Transfer("{B96B3CAF-0728-11D3-9D7B-0000F81EF32E}"); // PNG

                    string dir = Path.Combine(Path.GetTempPath(), "WiaScans");
                    Directory.CreateDirectory(dir);

                    string path = Path.Combine(dir, $"page_{DateTime.Now:yyyyMMdd_HHmmss_fff}.png");
                    image.SaveFile(path);
                    scannedImages.Add(path);

                    this.Invoke(new Action(() =>
                    {
                        textBox1.AppendText($"✅ Page {pageNumber} scannée : {path}\r\n");
                    }));

                    var result = MessageBox.Show("Page scannée. Scanner une autre page ?", "Scan multipage", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
                    continuer = (result == DialogResult.Yes);
                    pageNumber++;
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"❌ Erreur scan : {ex.Message}");
                    break;
                }
            }
        }

        private async void button1_Click(object sender, EventArgs e)
        {
            scannedImages.Clear();
            textBox1.Clear();

            try
            {
                await Task.Run(() => ScanMultiplePages());
                textBox1.AppendText($"📄 Total pages scannées : {scannedImages.Count}\r\n");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Erreur globale : {ex.Message}");
            }
        }

        private void button2_Click(object sender, EventArgs e)
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

                string pdfPath = Path.Combine(outputDir, $"Document_Scanné_{DateTime.Now:yyyyMMdd_HHmmss}.pdf");

                using (var stream = new FileStream(pdfPath, FileMode.Create, FileAccess.Write, FileShare.None))
                using (var doc = new Document())
                using (var writer = PdfWriter.GetInstance(doc, stream))
                {
                    doc.Open();

                    foreach (string imgPath in scannedImages)
                    {
                        var img = iTextSharp.text.Image.GetInstance(imgPath);
                        img.ScaleToFit(doc.PageSize.Width - 50, doc.PageSize.Height - 50);
                        img.Alignment = Element.ALIGN_CENTER;
                        doc.Add(img);
                        doc.NewPage();
                    }

                    doc.Close();
                }

                MessageBox.Show($"✅ PDF créé : {pdfPath}");
                scannedImages.Clear();
                textBox1.AppendText("🧹 Liste des scans vidée.\r\n");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"❌ Erreur PDF : {ex.Message}");
            }
        }

        private void Form4_Load_1(object sender, EventArgs e)
        {

        }
    }
}
