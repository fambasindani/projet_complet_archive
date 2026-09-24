using System;
using System.Net;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace WindowScan
{
    static class Program
    {
        public static ScanForm MainScannerForm { get; private set; }
        private static HttpListener _httpListener;
        private static Thread _httpServerThread;
        private static bool _isRunning = true;

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            try
            {
                StartHttpServer();
                MainScannerForm = new ScanForm();
                Application.Run(MainScannerForm);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Erreur fatale: {ex.Message}",
                    "Erreur", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                StopHttpServer();
            }
        }

        private static void StartHttpServer()
        {
            try
            {
                _httpListener = new HttpListener();
                _httpListener.Prefixes.Add("http://localhost:8081/");
                _httpListener.Prefixes.Add("http://127.0.0.1:8081/");

                _httpServerThread = new Thread(HttpServerWorker);
                _httpServerThread.IsBackground = true;
                _httpServerThread.Start();

                Console.WriteLine("Serveur HTTP demarre sur http://localhost:8081");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur demarrage serveur HTTP: {ex.Message}");
            }
        }

        private static void StopHttpServer()
        {
            _isRunning = false;
            if (_httpListener != null && _httpListener.IsListening)
            {
                _httpListener.Stop();
                _httpListener.Close();
                Console.WriteLine("Serveur HTTP arrete");
            }
        }

        private static void HttpServerWorker()
        {
            try
            {
                _httpListener.Start();

                while (_isRunning && _httpListener.IsListening)
                {
                    try
                    {
                        var context = _httpListener.GetContext();
                        ThreadPool.QueueUserWorkItem(ProcessHttpRequest, context);
                    }
                    catch (HttpListenerException)
                    {
                        break;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Erreur serveur HTTP: {ex.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur serveur HTTP: {ex.Message}");
            }
        }

        private static void ProcessHttpRequest(object state)
        {
            var context = (HttpListenerContext)state;

            try
            {
                var request = context.Request;
                var response = context.Response;

                response.AppendHeader("Access-Control-Allow-Origin", "*");
                response.AppendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                response.AppendHeader("Access-Control-Allow-Headers", "Content-Type");

                if (request.HttpMethod == "OPTIONS")
                {
                    response.StatusCode = 200;
                    response.Close();
                    return;
                }

                string responseBody = "";
                int statusCode = 200;

                try
                {
                    if (request.HttpMethod == "POST")
                    {
                        string requestBody;
                        using (var reader = new System.IO.StreamReader(request.InputStream, System.Text.Encoding.UTF8))
                        {
                            requestBody = reader.ReadToEnd();
                        }

                        switch (request.Url.LocalPath.ToLower())
                        {
                            case "/api/start":
                                if (MainScannerForm == null)
                                {
                                    responseBody = "{\"success\":false,\"message\":\"Scanner non disponible\"}";
                                    statusCode = 503;
                                }
                                else if (!MainScannerForm.IsScannerAvailable())
                                {
                                    // Aucun scanner WIA present : on refuse le scan
                                    // au lieu de repondre faussement "demarre".
                                    responseBody = "{\"success\":false,\"message\":\"Aucun scanner detecte. Verifiez qu'il est branche et allume.\"}";
                                    statusCode = 503;
                                }
                                else if (MainScannerForm.IsScanningActive)
                                {
                                    responseBody = "{\"success\":false,\"message\":\"Un scan est deja en cours\"}";
                                    statusCode = 409;
                                }
                                else
                                {
                                    MainScannerForm.StartScan();
                                    responseBody = "{\"success\":true,\"message\":\"Scan demarre\"}";
                                }
                                break;

                            case "/api/setinfo":
                                dynamic data = null;
                                try { data = Newtonsoft.Json.JsonConvert.DeserializeObject<dynamic>(requestBody); } catch { }
                                if (MainScannerForm != null && data != null)
                                {
                                    int docId = data.documentId ?? 0;
                                    int classeurId = data.classeurId ?? 0;
                                    string token = data.token ?? "";
                                    string nom_fichier = data.nom_fichier ?? "";
                                    string uploadType = data.upload_type ?? "document";
                                    int idMinistere = data.id_ministere ?? 0;

                                    MainScannerForm.SetDocumentInfo(docId, classeurId, token, nom_fichier, uploadType, idMinistere);
                                    responseBody = "{\"success\":true,\"message\":\"Informations definies\"}";
                                }
                                else
                                {
                                    responseBody = "{\"success\":false,\"message\":\"Donnees invalides\"}";
                                    statusCode = 400;
                                }
                                break;

                            case "/api/seturl":
                                dynamic urlData = null;
                                try { urlData = Newtonsoft.Json.JsonConvert.DeserializeObject<dynamic>(requestBody); } catch { }
                                if (MainScannerForm != null && urlData != null)
                                {
                                    string url = urlData.url ?? "";
                                    MainScannerForm.SetApiUrl(url);
                                    responseBody = "{\"success\":true,\"message\":\"URL API definie\"}";
                                }
                                else
                                {
                                    responseBody = "{\"success\":false,\"message\":\"URL invalide\"}";
                                    statusCode = 400;
                                }
                                break;

                            case "/api/status":
                                if (MainScannerForm != null)
                                {
                                    bool isScanning = MainScannerForm.IsScanningActive;
                                    bool scannerOk = MainScannerForm.IsScannerAvailable();
                                    responseBody = $"{{\"success\":true,\"scanning\":{isScanning.ToString().ToLower()},\"ready\":{scannerOk.ToString().ToLower()},\"scanner\":{scannerOk.ToString().ToLower()}}}";
                                }
                                else
                                {
                                    responseBody = "{\"success\":false,\"message\":\"Scanner non disponible\"}";
                                    statusCode = 503;
                                }
                                break;

                            default:
                                responseBody = "{\"success\":false,\"message\":\"Endpoint non trouve\"}";
                                statusCode = 404;
                                break;
                        }
                    }
                    else if (request.HttpMethod == "GET")
                    {
                        switch (request.Url.LocalPath.ToLower())
                        {
                            case "/":
                            case "/api/ping":
                            case "/api/health":
                                bool ready = MainScannerForm != null && MainScannerForm.IsScannerAvailable();
                                responseBody = $"{{\"service\":\"window_scanner\",\"version\":\"1.0\",\"ready\":{ready.ToString().ToLower()},\"scanner\":{ready.ToString().ToLower()},\"timestamp\":\"{DateTime.Now:o}\"}}";
                                break;

                            case "/api/status":
                                // Le front interroge /api/status en GET pour suivre l'etat du scan.
                                if (MainScannerForm != null)
                                {
                                    bool isScanningG = MainScannerForm.IsScanningActive;
                                    bool scannerOkG = MainScannerForm.IsScannerAvailable();
                                    responseBody = $"{{\"success\":true,\"scanning\":{isScanningG.ToString().ToLower()},\"ready\":{scannerOkG.ToString().ToLower()},\"scanner\":{scannerOkG.ToString().ToLower()}}}";
                                }
                                else
                                {
                                    responseBody = "{\"success\":false,\"message\":\"Scanner non disponible\"}";
                                    statusCode = 503;
                                }
                                break;

                            default:
                                responseBody = "{\"success\":false,\"message\":\"Endpoint non trouve\"}";
                                statusCode = 404;
                                break;
                        }
                    }
                    else
                    {
                        responseBody = "{\"success\":false,\"message\":\"Methode non supportee\"}";
                        statusCode = 405;
                    }
                }
                catch (Exception ex)
                {
                    responseBody = $"{{\"success\":false,\"message\":\"Erreur interne: {ex.Message}\"}}";
                    statusCode = 500;
                }

                response.StatusCode = statusCode;
                response.ContentType = "application/json; charset=utf-8";

                byte[] buffer = Encoding.UTF8.GetBytes(responseBody);
                response.ContentLength64 = buffer.Length;
                response.OutputStream.Write(buffer, 0, buffer.Length);
                response.OutputStream.Close();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur traitement requete: {ex.Message}");
            }
        }
    }
}
