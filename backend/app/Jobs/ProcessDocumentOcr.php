<?php

namespace App\Jobs;

use App\Models\DocumentDeclaration;
use App\Services\OcrService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Extrait le texte OCR d'un document en arriere-plan.
 */
class ProcessDocumentOcr implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;
    public int $timeout = 300;

    protected int $documentId;
    protected string $filePath;

    public function __construct(int $documentId, string $filePath)
    {
        $this->documentId = $documentId;
        $this->filePath = $filePath;
    }

    public function handle(): void
    {
        try {
            $ocr = new OcrService();
            $res = $ocr->extractText($this->filePath);
            $doc = DocumentDeclaration::find($this->documentId);
            if ($doc) {
                if (!empty($res['success'])) {
                    $doc->montext = strip_tags($res['text']);
                    $doc->ocr_method = $res['method'] ?? null;
                    $doc->ocr_status = 'completed';
                } else {
                    $doc->ocr_status = 'failed';
                }
                $doc->save();
            }
        } catch (\Throwable $e) {
            Log::error('ProcessDocumentOcr error', ['error' => $e->getMessage()]);
        }
    }
}
