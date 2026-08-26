using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Windows.Forms;
using NTwain;
using NTwain.Data;
using iTextSharp.text;
using iTextSharp.text.pdf;
using System.Linq;

namespace WindowScan
{
    public partial class Form3 : Form
    {
        private TwainSession _twain;
        private DataSource _scanner;
        private List<string> scannedImages = new List<string>();

        public Form3()
        {
            InitializeComponent();

            _twain = new TwainSession(TWIdentity.CreateFromAssembly(DataGroups.Image, typeof(Form3).Assembly));

            _twain.TransferError += (s, e) => MessageBox.Show("❌ Erreur de transfert.");

            _twain.DataTransferred += (s, e) =>
            {
                if (e.NativeData != IntPtr.Zero)
                {
                    using (var image = System.Drawing.Image.FromHbitmap(e.NativeData))
                    {
                        string folder = @"D:\ScansTemp";
                        if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);

                        string fileName = $"page_{DateTime.Now:yyyyMMdd_HHmmss_fff}.jpg";
                        string path = Path.Combine(folder, fileName);
                        image.Save(path, ImageFormat.Jpeg);
                        scannedImages.Add(path);
                        MessageBox.Show($"✅ Page scannée : {fileName}");
                    }
                }
                else
                {
                    MessageBox.Show("⚠️ Aucune image transférée.");
                }
            };

            _twain.StateChanged += (s, e) =>
            {
                MessageBox.Show($"TWAIN State changed to: {_twain.State}");

                if (_twain.State == 3)
                {
                    var scanners = _twain.ToList();
                    if (scanners.Count == 0)
                    {
                        MessageBox.Show("⚠️ Aucun scanner TWAIN détecté.");
                    }
                    else
                    {
                        string names = string.Join(", ", scanners.Select(sc => sc.Name));
                        MessageBox.Show("Scanners détectés : " + names);

                        _scanner = scanners.First();
                        _twain.OpenSource(_scanner.Name);
                    }
                }

                if (_twain.State == 4)
                {
                    MessageBox.Show($"Scanner ouvert : {_scanner?.Name}");
                }
            };

            _twain.Open();
        }

        private void buttonScan_Click(object sender, EventArgs e)
        {
            if (_twain.State == 5 && _scanner?.IsOpen == true)
            {
                try
                {
                    // Utiliser ShowUI pour forcer l'affichage du scanner (test)
                    _scanner.Enable(SourceEnableMode.ShowUI, true, this.Handle);
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"❌ Activation impossible : {ex.Message}");
                }
            }
            else
            {
                MessageBox.Show("⚠️ Scanner non prêt.");
            }
        }

        private void buttonCreatePdf_Click(object sender, EventArgs e)
        {
           
        }

        private void Form3_Load(object sender, EventArgs e)
        {

        }

        private void buttonCreatePdf_Click_1(object sender, EventArgs e)
        {

            if (scannedImages.Count == 0)
            {
                MessageBox.Show("⚠️ Aucun scan disponible.");
                return;
            }

            string outputPath = @"D:\Scans\document_final.pdf";

            try
            {
                using (var stream = new FileStream(outputPath, FileMode.Create, FileAccess.Write, FileShare.None))
                using (var pdfDoc = new Document())
                using (var writer = PdfWriter.GetInstance(pdfDoc, stream))
                {
                    pdfDoc.Open();
                    foreach (string imgPath in scannedImages)
                    {
                        var pdfImage = iTextSharp.text.Image.GetInstance(imgPath);
                        pdfImage.ScaleToFit(pdfDoc.PageSize.Width - 50, pdfDoc.PageSize.Height - 50);
                        pdfImage.Alignment = Element.ALIGN_CENTER;
                        pdfDoc.Add(pdfImage);
                        pdfDoc.NewPage();
                    }
                    pdfDoc.Close();
                }

                MessageBox.Show($"📄 PDF créé : {outputPath}");
                scannedImages.Clear();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"❌ Erreur création PDF : {ex.Message}");
            }

        }
    }
}
