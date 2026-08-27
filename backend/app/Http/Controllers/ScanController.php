<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ScanController extends Controller
{
    private $folder = "scans"; // public/storage/scans

    /**
     * Upload un PDF scanné (sans base de données)
     */
    public function upload(Request $request)
    {
        try {
            // Validation simplifiée
            $request->validate([
                'scan_file' => 'required|mimes:pdf|max:51200', // 50MB max
                'scan_date' => 'nullable|date',
                'scanner_source' => 'nullable|string',
            ]);

            if (!$request->hasFile('scan_file')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Aucun fichier reçu'
                ], 400);
            }

            $file = $request->file('scan_file');
            
            // Générer un nom unique
            $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $filename = Str::slug($originalName) . '_' . date('Ymd_His') . '_' . Str::random(6) . '.pdf';
            
            // Stocker dans public/storage/scans
            $path = $file->storeAs($this->folder, $filename, 'public');
            
            // Compter les pages PDF
            $fullPath = storage_path('app/public/' . $path);
            $pages = $this->countPdfPages($fullPath);
            
            // Calculer la taille
            $fileSize = $file->getSize();
            $fileSizeMB = round($fileSize / 1024 / 1024, 2);
            $fileSizeKB = round($fileSize / 1024, 2);

            Log::info('Scan uploadé avec succès (sans DB)', [
                'filename' => $filename,
                'original_name' => $file->getClientOriginalName(),
                'size' => $fileSize,
                'size_mb' => $fileSizeMB,
                'pages' => $pages,
                'path' => $path,
                'scanner_source' => $request->input('scanner_source')
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Fichier scanné uploadé avec succès',
                'fileUrl' => asset("storage/{$path}"),
                'fileInfo' => [
                    'name' => $filename,
                    'original_name' => $file->getClientOriginalName(),
                    'size' => $fileSizeKB . ' KB',
                    'size_mb' => $fileSizeMB,
                    'pages' => $pages,
                    'uploaded_at' => now()->toDateTimeString(),
                    'scanned_at' => $request->input('scan_date', now()->toDateTimeString()),
                    'source_scanner' => $request->input('scanner_source', 'Windows Scanner'),
                    'path' => $path
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            Log::error('Erreur upload scan', [
                'error' => $e->getMessage(),
                'file' => $request->file('scan_file')?->getClientOriginalName()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors de l\'upload: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload multiple PDF (sans base de données)
     */
    public function uploadMultiple(Request $request)
    {
        try {
            $request->validate([
                'files' => 'required|array',
                'files.*' => 'file|mimes:pdf|max:51200', // max 50 Mo
                'id_classeur' => 'nullable|integer',
            ]);

            $documents = [];

            foreach ($request->file('files') as $file) {
                $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $filename = Str::slug($originalName) . '_' . date('Ymd_His') . '_' . Str::random(6) . '.pdf';
                
                // Créer une structure de dossier si id_classeur fourni
                if ($request->has('id_classeur')) {
                    $dossier = $this->folder . '/classeur_' . ($request->id_classeur + 100) . '/' . date('Y') . '/' . date('m');
                } else {
                    $dossier = $this->folder . '/' . date('Y') . '/' . date('m');
                }
                
                // Stockage dans le dossier spécifique
                $path = $file->storeAs($dossier, $filename, 'public');
                
                // Compter les pages
                $fullPath = storage_path('app/public/' . $path);
                $pages = $this->countPdfPages($fullPath);
                $fileSizeMB = round($file->getSize() / 1024 / 1024, 2);
                $fileSizeKB = round($file->getSize() / 1024, 2);

                $documents[] = [
                    'name' => $filename,
                    'original_name' => $file->getClientOriginalName(),
                    'url' => asset("storage/{$path}"),
                    'size' => $fileSizeKB . ' KB',
                    'size_mb' => $fileSizeMB,
                    'pages' => $pages,
                    'path' => $path,
                    'dossier' => $dossier,
                    'uploaded_at' => now()->toDateTimeString()
                ];

                Log::info('Fichier uploadé multiple', [
                    'filename' => $filename,
                    'dossier' => $dossier,
                    'classeur_id' => $request->input('id_classeur')
                ]);
            }

            return response()->json([
                'status' => 'success',
                'message' => count($documents) . ' fichier(s) PDF uploadé(s) avec succès ✅',
                'documents' => $documents
            ], 201);

        } catch (\Exception $e) {
            Log::error('Erreur upload multiple', [
                'error' => $e->getMessage(),
                'classeur_id' => $request->input('id_classeur')
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors de l\'upload multiple: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lister tous les scans (sans base de données)
     */
    public function listScans(Request $request)
    {
        try {
            // Lister les fichiers dans le dossier scans
            $files = Storage::disk('public')->allFiles($this->folder);
            
            $scans = [];
            foreach ($files as $file) {
                if (pathinfo($file, PATHINFO_EXTENSION) === 'pdf') {
                    $filePath = storage_path('app/public/' . $file);
                    
                    if (file_exists($filePath)) {
                        $fileInfo = [
                            'name' => basename($file),
                            'path' => $file,
                            'url' => asset("storage/{$file}"),
                            'size' => round(filesize($filePath) / 1024, 2) . ' KB',
                            'size_bytes' => filesize($filePath),
                            'modified' => date('Y-m-d H:i:s', Storage::disk('public')->lastModified($file)),
                            'pages' => $this->countPdfPages($filePath)
                        ];
                        
                        // Extraire des infos du nom de fichier
                        $filename = basename($file);
                        if (preg_match('/classeur_(\d+)/', $file, $matches)) {
                            $fileInfo['classeur_id'] = (int)$matches[1] - 100;
                        }
                        
                        $scans[] = $fileInfo;
                    }
                }
            }
            
            // Trier par date de modification (plus récent en premier)
            usort($scans, function($a, $b) {
                return strtotime($b['modified']) - strtotime($a['modified']);
            });

            return response()->json([
                'status' => 'success',
                'scans' => $scans,
                'count' => count($scans),
                'folder' => $this->folder
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur list scans', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors de la récupération des scans'
            ], 500);
        }
    }

    /**
     * Télécharger un scan - sécurisé
     */
    public function download($filename)
    {
        try {
            $filename = basename($filename);
            if (!preg_match('/^[a-zA-Z0-9_\-\.]+\.pdf$/i', $filename)) {
                return response()->json(['status' => 'error','message' => 'Nom de fichier invalide'], 400);
            }
            // Chercher le fichier dans tous les sous-dossiers
            $files = Storage::disk('public')->allFiles($this->folder);
            $filePath = null;

            foreach ($files as $file) {
                if (basename($file) === $filename) {
                    $filePath = $file;
                    break;
                }
            }
            
            if (!$filePath) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Fichier non trouvé: ' . $filename
                ], 404);
            }

            $fullPath = "public/{$filePath}";
            
            if (!Storage::exists($fullPath)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Fichier non trouvé dans le stockage'
                ], 404);
            }

            Log::info('Téléchargement scan', [
                'filename' => $filename,
                'path' => $filePath
            ]);

            return Storage::download($fullPath, $filename);

        } catch (\Exception $e) {
            Log::error('Erreur download scan', [
                'error' => $e->getMessage(),
                'filename' => $filename
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors du téléchargement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un scan - sécurisé
     */
    public function delete($filename)
    {
        try {
            $filename = basename($filename);
            if (!preg_match('/^[a-zA-Z0-9_\-\.]+\.pdf$/i', $filename)) {
                return response()->json(['status' => 'error','message' => 'Nom de fichier invalide'], 400);
            }
            // Chercher le fichier dans tous les sous-dossiers
            $files = Storage::disk('public')->allFiles($this->folder);
            $filePath = null;

            foreach ($files as $file) {
                if (basename($file) === $filename) {
                    $filePath = $file;
                    break;
                }
            }
            
            if (!$filePath) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Fichier non trouvé: ' . $filename
                ], 404);
            }

            $fullPath = "public/{$filePath}";
            
            if (!Storage::exists($fullPath)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Fichier non trouvé dans le stockage'
                ], 404);
            }

            // Journalisation avant suppression
            Log::info('Suppression scan', [
                'filename' => $filename,
                'path' => $filePath,
                'deleted_by' => auth()->id() ?? 'api'
            ]);

            // Supprimer le fichier
            Storage::delete($fullPath);

            // Vérifier si le dossier parent est vide et le supprimer si c'est le cas
            $directory = dirname($filePath);
            if ($directory !== $this->folder && count(Storage::disk('public')->allFiles($directory)) === 0) {
                Storage::disk('public')->deleteDirectory($directory);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Scan "' . $filename . '" supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur suppression scan', [
                'error' => $e->getMessage(),
                'filename' => $filename
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Rechercher des scans
     */
    public function search(Request $request)
    {
        try {
            $searchTerm = $request->input('q', '');
            $files = Storage::disk('public')->allFiles($this->folder);
            
            $scans = [];
            foreach ($files as $file) {
                if (pathinfo($file, PATHINFO_EXTENSION) === 'pdf') {
                    $filename = basename($file);
                    
                    // Filtrer par terme de recherche
                    if (empty($searchTerm) || stripos($filename, $searchTerm) !== false) {
                        $filePath = storage_path('app/public/' . $file);
                        
                        if (file_exists($filePath)) {
                            $scans[] = [
                                'name' => $filename,
                                'path' => $file,
                                'url' => asset("storage/{$file}"),
                                'size' => round(filesize($filePath) / 1024, 2) . ' KB',
                                'modified' => date('Y-m-d H:i:s', Storage::disk('public')->lastModified($file)),
                                'pages' => $this->countPdfPages($filePath)
                            ];
                        }
                    }
                }
            }
            
            // Trier par date de modification
            usort($scans, function($a, $b) {
                return strtotime($b['modified']) - strtotime($a['modified']);
            });

            return response()->json([
                'status' => 'success',
                'scans' => $scans,
                'count' => count($scans),
                'search_term' => $searchTerm
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur recherche scans', [
                'error' => $e->getMessage(),
                'search_term' => $request->input('q')
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors de la recherche'
            ], 500);
        }
    }

    /**
     * Nettoyer les anciens scans
     */
    public function cleanup(Request $request)
    {
        try {
            $days = $request->input('days', 30); // Par défaut 30 jours
            $files = Storage::disk('public')->allFiles($this->folder);
            
            $deleted = [];
            $kept = [];
            
            foreach ($files as $file) {
                if (pathinfo($file, PATHINFO_EXTENSION) === 'pdf') {
                    $lastModified = Storage::disk('public')->lastModified($file);
                    $ageInDays = (time() - $lastModified) / (60 * 60 * 24);
                    
                    if ($ageInDays > $days) {
                        $fullPath = "public/{$file}";
                        Storage::delete($fullPath);
                        $deleted[] = basename($file);
                        
                        Log::info('Fichier nettoyé', [
                            'filename' => basename($file),
                            'age_days' => floor($ageInDays),
                            'last_modified' => date('Y-m-d H:i:s', $lastModified)
                        ]);
                    } else {
                        $kept[] = basename($file);
                    }
                }
            }
            
            // Nettoyer les dossiers vides
            $this->cleanEmptyDirectories();

            return response()->json([
                'status' => 'success',
                'message' => 'Nettoyage terminé',
                'deleted_count' => count($deleted),
                'kept_count' => count($kept),
                'deleted_files' => $deleted,
                'days_threshold' => $days
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur cleanup scans', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors du nettoyage: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Nettoyer les dossiers vides
     */
    private function cleanEmptyDirectories()
    {
        $directories = Storage::disk('public')->allDirectories($this->folder);
        
        // Trier par profondeur (les plus profonds d'abord)
        usort($directories, function($a, $b) {
            return substr_count($b, '/') - substr_count($a, '/');
        });
        
        foreach ($directories as $directory) {
            $files = Storage::disk('public')->allFiles($directory);
            $subDirs = Storage::disk('public')->allDirectories($directory);
            
            if (empty($files) && empty($subDirs)) {
                Storage::disk('public')->deleteDirectory($directory);
                Log::info('Dossier vide supprimé', ['directory' => $directory]);
            }
        }
    }

    /**
     * Vérifier la santé de l'API - sans divulgation sensible
     */
    public function health()
    {
        try {
            $files = Storage::disk('public')->allFiles($this->folder);
            $pdfFiles = array_filter($files, function($file) {
                return pathinfo($file, PATHINFO_EXTENSION) === 'pdf';
            });

            $folderSize = 0;
            foreach ($pdfFiles as $file) {
                try { $folderSize += Storage::disk('public')->size($file); } catch (\Throwable $e) {}
            }

            return response()->json([
                'status' => 'healthy',
                'timestamp' => now()->toDateTimeString(),
                'storage' => [
                    'folder' => $this->folder,
                    'file_count' => count($pdfFiles),
                    'folder_size' => round($folderSize / 1024 / 1024, 2) . ' MB'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'unhealthy',
                'message' => $e->getMessage(),
                'timestamp' => now()->toDateTimeString()
            ], 500);
        }
    }

    /**
     * Compter les pages d'un PDF
     */
    private function countPdfPages($filePath)
    {
        try {
            if (!file_exists($filePath)) {
                return 1;
            }

            $fp = @fopen($filePath, "r");
            if (!$fp) return 1;
            
            $pagecount = 0;
            while(!feof($fp)) {
                $line = fgets($fp, 255);
                if (preg_match('/\/Count [0-9]+/', $line, $matches)){
                    preg_match('/[0-9]+/', $matches[0], $matches2);
                    $pagecount = max($pagecount, $matches2[0]);
                }
            }
            fclose($fp);
            
            return $pagecount > 0 ? $pagecount : 1;
        } catch (\Exception $e) {
            return 1;
        }
    }
}