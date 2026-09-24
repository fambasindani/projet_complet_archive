<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OcrService
{
    protected string $ocrUrl;
    protected string $batchUrl;
    protected string $token;

    public function __construct()
    {
        $this->ocrUrl = config('ocr.flask_url', 'http://127.0.0.1:5000/api/ocr');
        $this->batchUrl = config('ocr.flask_batch_url', 'http://127.0.0.1:5000/api/ocr-batch');
        $this->token = config('ocr.flask_token', 'ocr_secret_token_2026');
    }

    public function extractText(string $filePath): array
    {
        if (!file_exists($filePath)) {
            return ['success' => false, 'message' => 'Fichier introuvable'];
        }

        try {
            $response = Http::timeout(280)
                ->attach('file', file_get_contents($filePath), basename($filePath))
                ->withHeaders(['Authorization' => 'Bearer ' . $this->token])
                ->post($this->ocrUrl);

            if ($response->successful()) {
                $body = $response->json();
                if ($body['status'] === 'success') {
                    return [
                        'success' => true,
                        'text' => $body['data']['text'] ?? '',
                        'raw_text' => $body['data']['raw_text'] ?? '',
                        'pages' => $body['data']['pages'] ?? 0,
                        'method' => $body['data']['method'] ?? 'unknown',
                        'text_length' => $body['data']['text_length'] ?? 0,
                        'word_count' => $body['data']['word_count'] ?? 0,
                        'processing_time' => $body['data']['processing_time'] ?? 0,
                    ];
                }
                return ['success' => false, 'message' => $body['message'] ?? 'Erreur OCR'];
            }

            Log::error('OCR service error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return ['success' => false, 'message' => 'Erreur service OCR: ' . $response->status()];

        } catch (\Exception $e) {
            Log::error('OCR service unreachable', ['error' => $e->getMessage()]);
            return ['success' => false, 'message' => 'Service OCR indisponible: ' . $e->getMessage()];
        }
    }

    public function extractTextBatch(array $filePaths): array
    {
        try {
            $http = Http::timeout(300)
                ->withHeaders(['Authorization' => 'Bearer ' . $this->token]);

            foreach ($filePaths as $index => $path) {
                if (file_exists($path)) {
                    $http = $http->attach(
                        "files[{$index}]",
                        file_get_contents($path),
                        basename($path)
                    );
                }
            }

            $response = $http->post($this->batchUrl);

            if ($response->successful()) {
                return $response->json();
            }

            return ['status' => 'error', 'message' => 'Erreur batch: ' . $response->status()];

        } catch (\Exception $e) {
            Log::error('OCR batch service unreachable', ['error' => $e->getMessage()]);
            return ['status' => 'error', 'message' => 'Service OCR indisponible: ' . $e->getMessage()];
        }
    }

    public function checkHealth(): bool
    {
        try {
            $response = Http::timeout(5)->get(
                config('ocr.flask_url', 'http://127.0.0.1:5000/api/ocr')
            );
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }
}
