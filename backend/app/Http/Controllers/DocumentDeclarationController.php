<?php

namespace App\Http\Controllers;

use App\Models\DocumentDeclaration;
use App\Services\OcrService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;




class DocumentDeclarationController extends Controller
{

    
public function getallpdf($id_declaration)
{
    // 🔎 Récupère les documents liés à la déclaration avec l'ID donné
    return DocumentDeclaration::where('id_declaration', $id_declaration)
                              ->orderBy('id', 'desc') // facultatif, pour trier les plus récents d’abord
                              ->get();
}

public function deleteDocument($id)
{
    // 🔎 Récupère le document avec l'ID donné
    $document = DocumentDeclaration::find($id);

    // Vérifie si le document existe
    if (!$document) {
        return response()->json(['message' => 'Document non trouvé'], 404);
    }

    // Suppression du document
    $document->delete();

    // Retourne une réponse indiquant le succès de l'opération
    return response()->json(['message' => 'Document supprimé avec succès']);
}






// 📤 Upload multiple PDF dans dossier par id_classeur + 100
public function uploadMultiplex(Request $request)
{
    $request->validate([
        'files'           => 'required|array',
        'files.*'         => 'file|mimes:pdf|max:51200', // max 50 Mo
        'id_declaration'  => 'required|integer',
        'id_classeur'     => 'required|integer',
    ]);

    $documents = [];

    foreach ($request->file('files') as $file) {

        $ext = strtolower($file->getClientOriginalExtension() ?: 'pdf');
        if ($ext === '') $ext = 'pdf';
        $nomFichier = Str::uuid() . '.' . $ext;
        $dossier = "document_declaration/" . ($request->id_classeur + 100);

        // 📁 stockage dans le dossier spécifique (ta logique conservée)
        $file->storeAs($dossier, $nomFichier);

        // 📏 taille du fichier en bytes
        $taille = $file->getSize();

        // 💾 enregistrement DB (on ajoute seulement 'taille')
        $documents[] = DocumentDeclaration::create([
            'id_declaration' => $request->id_declaration,
            'id_classeur'    => $request->id_classeur,
            'nom_fichier'    => $nomFichier,
            'nom_native'     => $file->getClientOriginalName(),
            'taille'         => $taille, // ✅ AJOUT ICI
        ]);
    }

    return response()->json([
        'message'   => 'Fichiers PDF uploadés avec succès ✅',
        'documents' => $documents
    ], 201);
}


    











    // 📥 Téléchargement du fichier PDF - sécurisé + vérif appartenance possible
    /**
     * Upload "brut" (contourne les WAF qui bloquent multipart).
     * POST /documents-declaration/upload-raw?id_declaration=..&id_classeur=..&nom_fichier=..
     * Le corps de la requete est le PDF brut (application/pdf).
     */
    public function uploadRaw(Request $request)
    {
        $idDeclaration = $request->query('id_declaration');
        $idClasseur = $request->query('id_classeur');
        $nomNative = $request->query('nom_fichier', 'scan.pdf');

        if (!$idDeclaration || !$idClasseur) {
            return response()->json(['success' => false, 'message' => 'Parametres manquants'], 422);
        }
        if (!\App\Models\Declaration::find($idDeclaration)) {
            return response()->json(['success' => false, 'message' => 'Declaration introuvable'], 422);
        }
        if (!\App\Models\Classeur::find($idClasseur)) {
            return response()->json(['success' => false, 'message' => 'Classeur introuvable'], 422);
        }

        $content = $request->getContent();
        if (!$content) {
            return response()->json(['success' => false, 'message' => 'Fichier vide'], 422);
        }

        $nomFichier = \Illuminate\Support\Str::uuid() . '.pdf';
        $dossier = "document_declaration/" . ($idClasseur + 100);
        \Illuminate\Support\Facades\Storage::put($dossier . '/' . $nomFichier, $content);
        $filePath = storage_path("app/{$dossier}/{$nomFichier}");

        $document = DocumentDeclaration::create([
            'id_declaration' => $idDeclaration,
            'id_classeur' => $idClasseur,
            'nom_fichier' => $nomFichier,
            'nom_native' => $nomNative,
            'taille' => strlen($content),
        ]);
        $document->ocr_status = 'pending';
        $document->save();

        \App\Jobs\ProcessDocumentOcr::dispatch($document->id, $filePath);

        return response()->json(['success' => true, 'documents' => [$document]], 201);
    }

    public function download($id)
{
    $document = DocumentDeclaration::findOrFail($id);

    $idClasseur = $document->id_classeur ?? null;

    if (!$idClasseur) {
        return response()->json(['error' => 'Classeur non défini'], 400);
    }

    $nomFichier = basename($document->nom_fichier);
    if (!preg_match('/^[a-zA-Z0-9_\-]+\.pdf$/i', $nomFichier)) {
        return response()->json(['error' => 'Nom de fichier invalide'], 400);
    }

    $dossier = "document_declaration/" . ((int)$idClasseur + 100);
    $chemin = storage_path("app/{$dossier}/{$nomFichier}");

    if (!file_exists($chemin)) {
        return response()->json(['error' => 'Fichier introuvable'], 404);
    }

    $content = file_get_contents($chemin);

    return response($content, 200, [
        'Content-Type' => 'application/pdf',
        'Content-Disposition' => 'inline; filename="' . addslashes($document->nom_native) . '"',
        'Access-Control-Allow-Origin' => '*',
    ]);
}






    public function uploadMultiple(Request $request)
    {
        $request->validate([
            'files'           => 'required|array|max:10',
            'files.*'         => 'file|mimes:pdf|max:51200',
            'id_declaration'  => 'required|integer|exists:declarations,id',
            'id_classeur'     => 'required|integer|exists:classeurs,id',
        ]);

        $documents = [];
        $ocrService = new OcrService();
        $errors = [];

        foreach ($request->file('files') as $file) {
            $ext = strtolower($file->getClientOriginalExtension() ?: 'pdf');
        if ($ext === '') $ext = 'pdf';
        $nomFichier = Str::uuid() . '.' . $ext;
            $dossier = "document_declaration/" . ($request->id_classeur + 100);

            $path = $file->storeAs($dossier, $nomFichier);
            $taille = $file->getSize();
            $filePath = storage_path("app/{$dossier}/{$nomFichier}");

            // Enregistre le document IMMEDIATEMENT (sans attendre l'OCR)
            $document = DocumentDeclaration::create([
                'id_declaration' => $request->id_declaration,
                'id_classeur'    => $request->id_classeur,
                'nom_fichier'    => $nomFichier,
                'nom_native'     => $file->getClientOriginalName(),
                'taille'         => $taille,
            ]);
            $document->ocr_status = 'pending';
            $document->save();
            $documents[] = $document;

            // OCR en arriere-plan via la file d'attente (worker separe) :
            // le document apparait tout de suite, le serveur web n'est pas bloque.
            \App\Jobs\ProcessDocumentOcr::dispatch($document->id, $filePath);
        }

        if (empty($documents) && !empty($errors)) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun fichier traité - OCR a échoué pour tous',
                'errors' => $errors,
            ], 422);
        }

        return response()->json([
            'success'   => true,
            'message'   => count($documents) . ' fichier(s) uploadé(s) avec OCR',
            'documents' => $documents,
            'errors'    => !empty($errors) ? $errors : null,
        ], 201);
    }

    public function ocrDocument($id)
    {
        $document = DocumentDeclaration::find($id);
        if (!$document) {
            return response()->json(['success' => false, 'message' => 'Document non trouvé'], 404);
        }

        $dossier = "document_declaration/" . ($document->id_classeur + 100);
        $filePath = storage_path("app/{$dossier}/{$document->nom_fichier}");

        if (!file_exists($filePath)) {
            return response()->json(['success' => false, 'message' => 'Fichier physique introuvable'], 404);
        }

        $ocrService = new OcrService();
        $result = $ocrService->extractText($filePath);

        if ($result['success']) {
            $document->montext = strip_tags($result['text']);
            $document->save();
            return response()->json([
                'success' => true,
                'message' => 'OCR terminé avec succès',
                'data' => [
                    'text_length' => strlen($document->montext),
                    'method' => $result['method'],
                    'pages' => $result['pages'],
                    'processing_time' => $result['processing_time'],
                ]
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $result['message']
        ], 500);
    }

    public function ocrHealth()
    {
        $ocrService = new OcrService();
        $healthy = $ocrService->checkHealth();
        return response()->json([
            'status' => $healthy ? 'ok' : 'unavailable',
            'service' => 'ocr',
        ], $healthy ? 200 : 503);
    }

    /**
     * 🔄 Mettre à jour le texte OCR d'un document
     * (Appelé par le frontend après OCR) - sanitized
     */
    public function updateOCRText(Request $request, $id)
    {
        $request->validate([
            'montext' => 'nullable|string|max:500000'
        ]);

        $document = DocumentDeclaration::findOrFail($id);
        // Nettoyage XSS stockée : on conserve le texte brut mais on strip les tags
        $clean = $request->montext ? strip_tags($request->montext) : null;
        $document->montext = $clean;
        $document->save();

        return response()->json([
            'success' => true,
            'message' => 'Texte OCR mis à jour avec succès',
            'data' => [
                'id' => $document->id,
                'montext_length' => strlen($document->montext ?? 0)
            ]
        ]);
    }

    /**
     * 📄 Récupérer le texte OCR d'un document
     */
    public function getDocumentText($id)
    {
        $document = DocumentDeclaration::findOrFail($id);
        
        return response()->json([
            'success' => true,
            'montext' => $document->montext,
            'nom' => $document->nom_native
        ]);
    }

    /**
     * 🔍 Recherche avancée dans les documents OCR
     */
public function advancedSearch(Request $request, $id_direction)
{
    // Récupérer les paramètres
    $query = $request->input('query');
    $id_declaration = $request->input('id_declaration');
    $id_classeur = $request->input('id_classeur');
    $date_debut = $request->input('date_debut');
    $date_fin = $request->input('date_fin');
    $directionIds = $request->input('direction_ids');
    $page = $request->input('page', 1);
    $per_page = $request->input('per_page', 10);
    $sort_by = $request->input('sort_by', 'created_at');
    $sort_order = $request->input('sort_order', 'desc');

    \Log::info('=== RECHERCHE AVANCÉE DOCUMENTS ===');
    \Log::info('ID Direction utilisateur: ' . $id_direction);
    \Log::info('Query: ' . ($query ?? 'aucun'));
    \Log::info('ID Déclaration: ' . ($id_declaration ?? 'aucun'));
    \Log::info('ID Classeur: ' . ($id_classeur ?? 'aucun'));

    // Construire la requête sur DocumentDeclaration
    $queryBuilder = DocumentDeclaration::query();

    // 🔒 FILTRE PAR DIRECTIONS (utilisateur + supplémentaires combinés en OR)
    // La direction de l'utilisateur est TOUJOURS incluse
    $allDirectionIds = [(int)$id_direction];
    if ($directionIds) {
        if (is_string($directionIds)) {
            $directionIds = explode(',', $directionIds);
        }
        $directionIds = array_map('intval', $directionIds);
        $directionIds = array_filter($directionIds, fn($id) => $id > 0);
        $allDirectionIds = array_merge($allDirectionIds, $directionIds);
    }
    $allDirectionIds = array_unique($allDirectionIds);

    \Log::info('Filtrage par directions (OR): ' . implode(', ', $allDirectionIds));

    $queryBuilder->whereHas('declaration', function ($q) use ($allDirectionIds) {
        $q->whereIn('id_direction', $allDirectionIds);
    });

    // 🔍 RECHERCHE DANS TEXTE OCR (montext) - échappée + FULLTEXT si dispo
    if ($query) {
        $escaped = addcslashes($query, '%_\\');
        $queryBuilder->where(function ($q) use ($escaped, $query) {
            $q->where('montext', 'LIKE', "%{$escaped}%")
              ->orWhere('nom_native', 'LIKE', "%{$escaped}%")
              ->orWhere('nom_fichier', 'LIKE', "%{$escaped}%");
        });
    }

    // 🏷️ FILTRES DIRECTS
    if ($id_declaration) {
        $queryBuilder->where('id_declaration', $id_declaration);
    }

    if ($id_classeur) {
        $queryBuilder->where('id_classeur', $id_classeur);
    }

    // 📅 FILTRES PAR DATE
    if ($date_debut) {
        $queryBuilder->whereDate('created_at', '>=', $date_debut);
    }

    if ($date_fin) {
        $queryBuilder->whereDate('created_at', '<=', $date_fin);
    }

    // 📊 TRI
    if ($sort_by === 'direction_nom') {
        $queryBuilder->leftJoin('declarations', 'document_declarations.id_declaration', '=', 'declarations.id')
                     ->leftJoin('departements', 'declarations.id_direction', '=', 'departements.id')
                     ->orderBy('departements.nom', $sort_order)
                     ->select('document_declarations.*');
    } elseif ($sort_by === 'direction_id') {
        $queryBuilder->leftJoin('declarations', 'document_declarations.id_declaration', '=', 'declarations.id')
                     ->orderBy('declarations.id_direction', $sort_order)
                     ->select('document_declarations.*');
    } else {
        $queryBuilder->orderBy($sort_by, $sort_order);
    }

    // 📄 PAGINATION sécurisée
    $per_page = max(5, min((int)$per_page, 100));
    $page = max(1, (int)$page);
    $documents = $queryBuilder->with(['declaration.departement', 'declaration.classeur'])
        ->paginate($per_page, ['*'], 'page', $page);

    // TRANSFORMER LES DONNÉES
    $documents->getCollection()->transform(function ($doc) use ($query, $id_direction) {
        // Ajouter les infos de direction
        if ($doc->declaration && $doc->declaration->departement) {
            $doc->direction_id = $doc->declaration->departement->id;
            $doc->direction_nom = $doc->declaration->departement->nom;
        }

        // Ajouter les infos de classeur
        if ($doc->declaration && $doc->declaration->classeur) {
            $doc->classeur_nom = $doc->declaration->classeur->nom_classeur;
        }

        // Ajouter un extrait du texte OCR
        if ($query && $doc->montext) {
            $pos = stripos($doc->montext, $query);
            if ($pos !== false) {
                $start = max(0, $pos - 60);
                $length = min(strlen($doc->montext) - $start, 120);
                $doc->extrait = '...' . substr($doc->montext, $start, $length) . '...';
            } else {
                $doc->extrait = substr($doc->montext, 0, 150) . '...';
            }
        }

        // Statistiques du texte
        $doc->stats_texte = [
            'longueur' => strlen($doc->montext ?? ''),
            'mots' => str_word_count($doc->montext ?? ''),
            'pages_approx' => ceil(strlen($doc->montext ?? '') / 3000)
        ];

        // Ajouter l'info que le filtre direction utilisateur est appliqué
        $doc->filtre_direction_utilisateur = $id_direction;

        return $doc;
    });

    \Log::info('Nombre de résultats: ' . $documents->total());

    $response = [
        'success' => true,
        'data' => $documents->items(),
        'pagination' => [
            'current_page' => $documents->currentPage(),
            'last_page' => $documents->lastPage(),
            'per_page' => $documents->perPage(),
            'total' => $documents->total()
        ],
        'filters_applied' => [
            'user_direction' => $id_direction,
            'query' => $query,
            'id_declaration' => $id_declaration,
            'id_classeur' => $id_classeur,
            'direction_ids' => $directionIds,
            'date_debut' => $date_debut,
            'date_fin' => $date_fin,
            'sort_by' => $sort_by,
            'sort_order' => $sort_order
        ],
        'stats' => [
            'total_documents' => $documents->total(),
            'direction_filtree' => $id_direction
        ]
    ];

    return response(json_encode($response, JSON_INVALID_UTF8_SUBSTITUTE | JSON_UNESCAPED_UNICODE), 200, [
        'Content-Type' => 'application/json',
    ]);
}

    /**
     * 📊 Statistiques OCR
     */
    public function getOCRStats(Request $request)
    {
        $query = DocumentDeclaration::query();

        if ($request->filled('id_declaration')) {
            $query->where('id_declaration', $request->id_declaration);
        }

        $total = $query->count();
        $avecTexte = $query->clone()->whereNotNull('montext')->count();
        $sansTexte = $total - $avecTexte;

        // Taille moyenne du texte
        $tailleMoyenne = $query->clone()
            ->whereNotNull('montext')
            ->selectRaw('AVG(LENGTH(montext)) as moyenne')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'total_documents' => $total,
                'documents_avec_texte' => $avecTexte,
                'documents_sans_texte' => $sansTexte,
                'pourcentage_texte' => $total > 0 ? round(($avecTexte / $total) * 100, 2) : 0,
                'taille_moyenne_texte' => round($tailleMoyenne->moyenne ?? 0, 2) . ' caractères'
            ]
        ]);
    }

    /**
     * 🗑️ Supprimer un document
     */
    public function destroy($id)
    {
        $document = DocumentDeclaration::findOrFail($id);
        
        // Supprimer le fichier physique
        $path = "document_declaration/" . ($document->id_classeur + 100) . "/" . $document->nom_fichier;
        if (Storage::exists($path)) {
            Storage::delete($path);
        }

        $document->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document supprimé avec succès'
        ]);
    }

    /**
     * 📥 Télécharger un document
     */
    public function downloadxxx($id)
    {
        $document = DocumentDeclaration::findOrFail($id);
        $path = "document_declaration/" . ($document->id_classeur + 100) . "/" . $document->nom_fichier;

        if (!Storage::exists($path)) {
            return response()->json(['error' => 'Fichier non trouvé'], 404);
        }

        return Storage::downloadxx($path, $document->nom_native);
    }






































































}
