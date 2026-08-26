using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using WIA;

namespace WindowScan
{
    public partial class Form1 : Form
    {
        private HttpListener listener;

        public Form1()
        {
            InitializeComponent();
            StartHttpServer();
        }

        private async void StartHttpServer()
        {
            listener = new HttpListener();
            listener.Prefixes.Add("http://localhost:9000/");
            listener.Start();

            while (true)
            {
                try
                {
                    var context = await listener.GetContextAsync();
                    await HandleRequest(context);
                }
                catch (Exception) { }
            }
        }

        private async Task HandleRequest(HttpListenerContext context)
        {
            // 🔐 CORS headers
            context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
            context.Response.Headers.Add("Access-Control-Allow-Methods", "POST, OPTIONS");
            context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type");

            if (context.Request.HttpMethod == "OPTIONS")
            {
                context.Response.StatusCode = 200;
                context.Response.Close();
                return;
            }

            if (context.Request.HttpMethod == "POST" && context.Request.Url.AbsolutePath == "/scan")
            {
                string responseJson;

                try
                {
                    string scannedFilePath = await ScanDocumentInSTA();
                    bool uploaded = await UploadToLaravel(scannedFilePath);

                    responseJson = uploaded
                        ? "{\"status\":\"success\", \"message\":\"Scan et upload réussis\"}"
                        : "{\"status\":\"error\", \"message\":\"Échec upload\"}";

                    if (File.Exists(scannedFilePath))
                        File.Delete(scannedFilePath);
                }
                catch (Exception ex)
                {
                    responseJson = $"{{\"status\":\"error\", \"message\":\"{ex.Message.Replace("\"", "'")}\"}}";
                }

                byte[] buffer = Encoding.UTF8.GetBytes(responseJson);
                context.Response.ContentType = "application/json";
                context.Response.ContentLength64 = buffer.Length;
                await context.Response.OutputStream.WriteAsync(buffer, 0, buffer.Length);
                context.Response.OutputStream.Close();
            }
            else
            {
                context.Response.StatusCode = 404;
                context.Response.Close();
            }
        }

        private Task<string> ScanDocumentInSTA()
        {
            var tcs = new TaskCompletionSource<string>();

            Thread staThread = new Thread(() =>
            {
                try
                {
                    DeviceManager manager = new DeviceManager();
                    Device device = null;

                    for (int i = 1; i <= manager.DeviceInfos.Count; i++)
                    {
                        if (manager.DeviceInfos[i].Type == WiaDeviceType.ScannerDeviceType)
                        {
                            device = manager.DeviceInfos[i].Connect();
                            break;
                        }
                    }

                    if (device == null)
                        throw new Exception("Scanner introuvable");

                    try
                    {
                        Item item = device.Items[1];
                        ImageFile image = (ImageFile)item.Transfer("{B96B3CAF-0728-11D3-9D7B-0000F81EF32E}"); // PNG

                        string path = Path.Combine(Path.GetTempPath(), "scan_" + DateTime.Now.Ticks + ".png");
                        image.SaveFile(path);
                        tcs.SetResult(path);
                    }
                    catch
                    {
                        tcs.SetException(new Exception("Bac vide ou erreur transfert"));
                    }
                }
                catch (Exception ex)
                {
                    tcs.SetException(ex);
                }
            });

            staThread.SetApartmentState(ApartmentState.STA);
            staThread.Start();

            return tcs.Task;
        }

        private async Task<bool> UploadToLaravel(string filePath)
        {
            using (var client = new HttpClient())
            {
                var content = new MultipartFormDataContent();
                var fileContent = new ByteArrayContent(File.ReadAllBytes(filePath));
                fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("image/png");
                content.Add(fileContent, "scan", Path.GetFileName(filePath));

                var response = await client.PostAsync("http://localhost:8000/api/upload-scan", content);
                return response.IsSuccessStatusCode;
            }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            base.OnFormClosing(e);
            if (listener != null && listener.IsListening)
                listener.Stop();
        }

        private void Form1_Load(object sender, EventArgs e) { }
    }
}
