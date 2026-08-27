<?php

return [
    'flask_url' => env('FLASK_OCR_URL', 'http://127.0.0.1:5000/api/ocr'),
    'flask_batch_url' => env('FLASK_OCR_BATCH_URL', 'http://127.0.0.1:5000/api/ocr-batch'),
    'flask_token' => env('FLASK_OCR_TOKEN', 'ocr_secret_token_2026'),
];
