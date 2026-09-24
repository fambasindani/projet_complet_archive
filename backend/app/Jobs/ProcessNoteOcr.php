<?php

namespace App\Jobs;

use App\Models\DocumentNotePerception;
use App\Services\OcrService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Extrait le texte OCR d'un document de note de perception en arriere-plan.
 */
class ProcessNoteOcr implements ShouldQueue
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
            $doc = DocumentNotePerception::find($this->documentId);
            if ($doc && !empty($res['success'])) {
                $doc->montext = strip_tags($res['text']);
                $doc->save();
            }
        } catch (\Throwable $e) {
            Log::error('ProcessNoteOcr error', ['error' => $e->getMessage()]);
        }
    }
}
