using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Windows.Forms;
using NTwain;
using NTwain.Data;

namespace WindowScan
{
    public partial class Form2 : Form
    {
        private TwainSession _twain;
        private DataSource _scanner;

        public Form2()
        {
            InitializeComponent();

            // 📦 Initialisation de TWAIN
            _twain = new TwainSession(TWIdentity.CreateFromAssembly(DataGroups.Image, typeof(Form2).Assembly));

            // 🔁 Gestion des événements
            _twain.TransferError += (s, e) =>
            {
                MessageBox.Show("❌ Erreur lors du transfert de l'image.");
            };

            _twain.DataTransferred += (s, e) =>
            {
                if (e.NativeData != IntPtr.Zero)
                {
                    using (var image = Image.FromHbitmap(e.NativeData))
                    {
                        string directory = @"D:\Scans";
                        if (!Directory.Exists(directory))
                        {
                            Directory.CreateDirectory(directory); // ✅ Création dossier si absent
                        }

                        string fileName = $"scan_{DateTime.Now:yyyyMMdd_HHmmss}.jpg";
                        string path = Path.Combine(directory, fileName);
                        image.Save(path, ImageFormat.Jpeg); // 💾 Enregistrement

                        MessageBox.Show($"✅ Image enregistrée dans : {path}");
                    }
                }
                else
                {
                    MessageBox.Show("⚠️ Aucun flux d’image reçu.");
                }
            };

            _twain.StateChanged += (s, e) =>
            {
                if (_twain.State == 4)
                {
                    _scanner = _twain.FirstOrDefault();
                    if (_scanner != null)
                    {
                        _twain.OpenSource(_scanner.Name); // Passage à l’état 5
                    }
                    else
                    {
                        MessageBox.Show("⚠️ Aucun scanner détecté.");
                    }
                }
            };

            _twain.Open(); // Démarre la session TWAIN (état 3)
        }

        private void Form2_Load(object sender, EventArgs e)
        {
            // Tu peux ajouter du code ici si besoin
        }

        private void button1_Click(object sender, EventArgs e)
        {
            if (_twain.State == 5 && _scanner?.IsOpen == true)
            {
                try
                {
                    // ✅ Activation sans UI native avec handle de fenêtre
                    _scanner.Enable(SourceEnableMode.NoUI, false, this.Handle);
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"❌ Erreur d'activation du scanner : {ex.Message}");
                }
            }
            else
            {
                MessageBox.Show("⚠️ Le scanner n'est pas prêt ou non ouvert.");
            }
        }
    }
}
