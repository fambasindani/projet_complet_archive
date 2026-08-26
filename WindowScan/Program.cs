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
                // Démarrer le serveur HTTP
                StartHttpServer();

                // Créer le formulaire principal
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

                Console.WriteLine("🌐 Serveur HTTP démarré sur http://localhost:8081");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erreur démarrage serveur HTTP: {ex.Message}");
            }
        }

        private static void StopHttpServer()
        {
            _isRunning = false;

            if (_httpListener != null && _httpListener.IsListening)
            {
                _httpListener.Stop();
                _httpListener.Close();
                Console.WriteLine("🌐 Serveur HTTP arrêté");
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
                        Console.WriteLine($"⚠️ Erreur serveur HTTP: {ex.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erreur serveur HTTP: {ex.Message}");
            }
        }

        private static void ProcessHttpRequest(object state)
        {
            var context = (HttpListenerContext)state;

            try
            {
                var request = context.Request;
                var response = context.Response;

                // CORS headers
                response.AppendHeader("Access-Control-Allow-Origin", "*");
                response.AppendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                response.AppendHeader("Access-Control-Allow-Headers", "Content-Type");

                // Handle preflight
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
                        using (var reader = new System.IO.StreamReader(request.InputStream, request.ContentEncoding))
                        {
                            requestBody = reader.ReadToEnd();
                        }

                        var data = Newtonsoft.Json.JsonConvert.DeserializeObject<dynamic>(requestBody);

                        switch (request.Url.LocalPath.ToLower())
                        {
                            case "/api/start":
                                if (MainScannerForm != null)
                                {
                                    MainScannerForm.StartScan();
                                    responseBody = "{\"success\":true,\"message\":\"Scan démarré\"}";
                                }
                                else
                                {
                                    responseBody = "{\"success\":false,\"message\":\"Scanner non disponible\"}";
                                    statusCode = 503;
                                }
                                break;

                            case "/api/setinfo":
                                if (MainScannerForm != null && data != null)
                                {
                                    int docId = data.documentId ?? 0;
                                    int classeurId = data.classeurId ?? 0;
                                    string token = data.token ?? "";
                                    string nom_fichier = data.nom_fichier ?? "";

                                    MainScannerForm.SetDocumentInfo(docId, classeurId, token, nom_fichier);
                                    responseBody = "{\"success\":true,\"message\":\"Informations définies\"}";
                                }
                                else
                                {
                                    responseBody = "{\"success\":false,\"message\":\"Données invalides\"}";
                                    statusCode = 400;
                                }
                                break;




                            case "/api/seturl":
                                if (MainScannerForm != null && data != null)
                                {
                                    string url = data.url ?? "";
                                    MainScannerForm.SetApiUrl(url);
                                    responseBody = "{\"success\":true,\"message\":\"URL API définie\"}";
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
                                    responseBody = $"{{\"success\":true,\"scanning\":{isScanning.ToString().ToLower()},\"ready\":true}}";
                                }
                                else
                                {
                                    responseBody = "{\"success\":false,\"message\":\"Scanner non disponible\"}";
                                    statusCode = 503;
                                }
                                break;

                            default:
                                responseBody = "{\"success\":false,\"message\":\"Endpoint non trouvé\"}";
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
                                bool isScannerReady = MainScannerForm != null;
                                responseBody = $"{{\"service\":\"window_scanner\",\"version\":\"1.0\",\"ready\":{isScannerReady.ToString().ToLower()},\"timestamp\":\"{DateTime.Now:o}\"}}";
                                break;

                            default:
                                responseBody = "{\"success\":false,\"message\":\"Endpoint non trouvé\"}";
                                statusCode = 404;
                                break;
                        }
                    }
                    else
                    {
                        responseBody = "{\"success\":false,\"message\":\"Méthode non supportée\"}";
                        statusCode = 405;
                    }
                }
                catch (Exception ex)
                {
                    responseBody = $"{{\"success\":false,\"message\":\"Erreur interne: {ex.Message}\"}}";
                    statusCode = 500;
                }

                // Send response
                response.StatusCode = statusCode;
                response.ContentType = "application/json; charset=utf-8";

                byte[] buffer = Encoding.UTF8.GetBytes(responseBody);
                response.ContentLength64 = buffer.Length;
                response.OutputStream.Write(buffer, 0, buffer.Length);
                response.OutputStream.Close();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erreur traitement requête: {ex.Message}");
            }
        }
    }
}