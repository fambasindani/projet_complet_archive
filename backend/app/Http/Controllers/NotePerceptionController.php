<?php


namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\DocumentDeclaration;
use Illuminate\Support\Facades\Log;
use App\Models\NotePerception;
use App\Helpers\LogHelper;



class NotePerceptionController extends Controller
{
    // 📄 Liste paginée avec les relations
    public function getNote(Request $request)
    {
        $perPage = $request->input('per_page', 20);
        return NotePerception::with(['classeur', 'centre', 'assujetti', 'emplacement', 'utilisateur', 'ArticleBudgetaire'])
                             ->where('statut', 1)
                              ->orderBy('id', 'desc')
                             ->paginate($perPage);
    }

public function getNote_centre($id)
{
    return NotePerception::with([
        'classeur',
        'centre',
        'assujetti',
        'emplacement',
        'utilisateur',
        'articlebudgetaire'
    ])
    ->where('statut', 1)
    ->where('id_centre_ordonnancement', $id)
    ->orderBy('id', 'desc')
    ->paginate(10);
}


    // 🔍 Recherche sur les relations (nom_classeur, nom_centre, nom_emplacement, nom_assujetti)
    public function searchnote(Request $request)
    {
        $search = $request->input('search');
        $perPage = $request->input('per_page', 20);

        return NotePerception::with(['classeur', 'centre', 'assujetti', 'emplacement', 'utilisateur', "ArticleBudgetaire"])
            ->where('statut', 1)
            ->where(function ($query) use ($search) {
                $query->whereHas('classeur', function ($q) use ($search) {
                    $q->where('nom_classeur', 'like', "%{$search}%");
                })->orWhereHas('centre', function ($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%");
                })->orWhereHas('emplacement', function ($q) use ($search) {
                    $q->where('nom_emplacement', 'like', "%{$search}%");
                })->orWhereHas('assujetti', function ($q) use ($search) {
                    $q->where('nom_raison_sociale', 'like', "%{$search}%");
                });
            })
            ->orderBy('id', 'desc')
            ->paginate($perPage);
    }




  public function searchnote_id(Request $request, $id)
{
    $search = $request->input('search');

    return NotePerception::with(['classeur', 'centre', 'assujetti', 'emplacement', 'utilisateur', 'ArticleBudgetaire'])
        ->where('statut', 1)
        ->where('id_centre_ordonnancement', $id) // Ajout de la condition pour filtrer par id_ministere
        ->where(function ($query) use ($search) {
            $query->whereHas('classeur', function ($q) use ($search) {
                $q->where('nom_classeur', 'like', "%{$search}%");
            })->orWhereHas('centre', function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%");
            })->orWhereHas('emplacement', function ($q) use ($search) {
                $q->where('nom_emplacement', 'like', "%{$search}%");
            })->orWhereHas('assujetti', function ($q) use ($search) {
                $q->where('nom_raison_sociale', 'like', "%{$search}%");
            });
        })
        ->orderBy('id', 'desc')
        ->paginate(10);
}




public function searchnote_idcentre(Request $request, $id)
{
    $search = $request->input('search');

    return NotePerception::with([
        'classeur',
        'centre',
        'assujetti',
        'emplacement',
        'utilisateur',
        'articlebudgetaire'
    ])
    ->where('statut', 1)
    ->where('id_centre_ordonnancement', $id) // ✅ correction ici
    ->where(function ($query) use ($search) {
        $query->whereHas('classeur', function ($q) use ($search) {
            $q->where('nom_classeur', 'like', "%{$search}%");
        })->orWhereHas('centre', function ($q) use ($search) {
            $q->where('nom', 'like', "%{$search}%"); // ✅ correction ici
        })->orWhereHas('emplacement', function ($q) use ($search) {
            $q->where('nom_emplacement', 'like', "%{$search}%");
        })->orWhereHas('assujetti', function ($q) use ($search) {
            $q->where('nom_raison_sociale', 'like', "%{$search}%");
        });
    })
    ->orderBy('id', 'desc')
    ->paginate(10);
}






    // ➕ Création d’une note - sécurisé (id_user forcé depuis token)
    public function createnote(Request $request)
    {
        $validated = $request->validate([
            'id_ministere' => 'required|integer|exists:article_budgetaires,id',
            'numero_serie' => 'required|string|max:255',
            'numero_article' => 'nullable|string|max:50',
            'date_ordonnancement' => 'required|date',
            'date_enregistrement' => 'required|date',
            'id_classeur' => 'required|integer|exists:classeurs,id',
            'id_centre_ordonnancement' => 'required|integer|exists:centre_ordonnancements,id',
            'id_assujetti' => 'required|integer|exists:assujettis,id',
            'id_emplacement' => 'required|integer|exists:emplacements,id',
        ], [
            'id_ministere.required' => 'Le champ ministère est obligatoire.',
        ]);

        $validated['id_user'] = $request->user()->id;
        $validated['statut'] = 1;

        $note = NotePerception::create($validated);

        LogHelper::create('note_perceptions', $note->id, 'Création de la note de perception : ' . $note->numero_serie);

        return response()->json(['message' => 'Note enregistrée avec succès', 'data' => $note], 201);
    }

    // 🔍 Lecture d’une note spécifique
    public function  editnote($id)
    {
        return NotePerception::with(['classeur', 'centre', 'assujetti', 'emplacement', 'utilisateur'])
                             ->findOrFail($id);
    }

    // 📝 Mise à jour - sécurisé
    public function note(Request $request, $id)
    {
        $note = NotePerception::findOrFail($id);

        $validated = $request->validate([
            'id_ministere'=> 'required|integer|exists:article_budgetaires,id',
            'numero_serie' => 'required|string|max:255',
            'numero_article' => 'nullable|string|max:50',
            'date_ordonnancement' => 'required|date',
            'date_enregistrement' => 'required|date',
            'id_classeur'=> 'required|integer|exists:classeurs,id',
            'id_centre_ordonnancement'=> 'required|integer|exists:centre_ordonnancements,id',
            'id_assujetti'=> 'required|integer|exists:assujettis,id',
            'id_emplacement'=> 'required|integer|exists:emplacements,id',
        ]);

        $note->update($validated);

        LogHelper::update('note_perceptions', $note->id, 'Modification de la note de perception : ' . $note->numero_serie);

        return response()->json(['message' => 'Note modifiée avec succès', 'data' => $note]);
    }

    // ❌ Suppression logique
    public function deletenote($id)
    {
        $note = NotePerception::findOrFail($id);
        $note->update(['statut' => 0]);

        LogHelper::delete('note_perceptions', $note->id, 'Suppression de la note de perception : ' . $note->numero_serie);

        return response()->json(['message' => 'Note désactivée']);
    }






public function advancedSearch(Request $request)
{
    // Récupérer les paramètres
    $query = $request->input('query');
    $id_classeur = $request->input('id_classeur');
    $id_assujetti = $request->input('id_assujetti');
    $numero_article = $request->input('numero_article');
    $date_debut = $request->input('date_debut');
    $date_fin = $request->input('date_fin');
    $page = $request->input('page', 1);
    $per_page = $request->input('per_page', 10);
    $sort_by = $request->input('sort_by', 'note_perceptions.date_ordonnancement');
    $sort_order = $request->input('sort_order', 'desc');

    Log::info('=== RECHERCHE AVANCÉE NOTES DE PERCEPTION ===');
    Log::info('Query: ' . ($query ?? 'aucun'));
    Log::info('ID Classeur: ' . ($id_classeur ?? 'aucun'));
    Log::info('ID Assujetti: ' . ($id_assujetti ?? 'aucun'));
    Log::info('Numéro Article: ' . ($numero_article ?? 'aucun'));

    // Construire la requête sur DocumentDeclaration avec jointure vers NotePerception
    $queryBuilder = DocumentDeclaration::query();

    // 🔗 JOINTURE AVEC NOTE_PERCEPTION (id_declaration = note_perceptions.id)
    $queryBuilder->join('note_perceptions', 'document_declarations.id_declaration', '=', 'note_perceptions.id');

    // 🔍 RECHERCHE DANS LE TEXTE OCR (montext)
    if ($query) {
        $queryBuilder->where(function ($q) use ($query) {
            $q->where('document_declarations.montext', 'LIKE', "%{$query}%")
              ->orWhere('document_declarations.nom_native', 'LIKE', "%{$query}%")
              ->orWhere('document_declarations.nom_fichier', 'LIKE', "%{$query}%")
              ->orWhere('note_perceptions.numero_serie', 'LIKE', "%{$query}%")
              ->orWhere('note_perceptions.numero_article', 'LIKE', "%{$query}%");
        });
    }

    // 🏷️ FILTRES SUR NOTE_PERCEPTION
    if ($id_classeur) {
        $queryBuilder->where('note_perceptions.id_classeur', $id_classeur);
    }

    if ($id_assujetti) {
        $queryBuilder->where('note_perceptions.id_assujetti', $id_assujetti);
    }

    if ($numero_article) {
        $queryBuilder->where('note_perceptions.numero_article', 'LIKE', "%{$numero_article}%");
    }

    // 📅 FILTRES PAR DATE SUR NOTE_PERCEPTION
    if ($date_debut) {
        $queryBuilder->whereDate('note_perceptions.date_ordonnancement', '>=', $date_debut);
    }

    if ($date_fin) {
        $queryBuilder->whereDate('note_perceptions.date_ordonnancement', '<=', $date_fin);
    }

    // 📊 SÉLECTIONNER LES CHAMPS DES DEUX TABLES
    $queryBuilder->select(
        'document_declarations.*',
        'note_perceptions.id as note_id',
        'note_perceptions.numero_serie',
        'note_perceptions.numero_article',
        'note_perceptions.date_ordonnancement',
        'note_perceptions.id_assujetti',
        'note_perceptions.id_centre_ordonnancement',
        'note_perceptions.id_classeur as note_classeur_id',
        'note_perceptions.statut as note_statut'
    );

    // 📊 TRI - CORRECTION ICI
    if ($sort_by === 'classeur_nom') {
        $queryBuilder->leftJoin('classeurs', 'note_perceptions.id_classeur', '=', 'classeurs.id')
                     ->orderBy('classeurs.nom_classeur', $sort_order);
    } elseif ($sort_by === 'assujetti_nom') {
        $queryBuilder->leftJoin('assujettis', 'note_perceptions.id_assujetti', '=', 'assujettis.id')
                     ->orderBy('assujettis.nom_raison_sociale', $sort_order);
    } elseif ($sort_by === 'centre_nom') {
        $queryBuilder->leftJoin('centre_ordonnancements', 'note_perceptions.id_centre_ordonnancement', '=', 'centre_ordonnancements.id')
                     ->orderBy('centre_ordonnancements.nom', $sort_order);
    } elseif ($sort_by === 'date_ordonnancement') {
        // ✅ CORRECTION: Trier par la colonne de note_perceptions
        $queryBuilder->orderBy('note_perceptions.date_ordonnancement', $sort_order);
    } elseif ($sort_by === 'id') {
        $queryBuilder->orderBy('document_declarations.id', $sort_order);
    } elseif ($sort_by === 'created_at') {
        $queryBuilder->orderBy('document_declarations.created_at', $sort_order);
    } elseif ($sort_by === 'taille') {
        $queryBuilder->orderBy('document_declarations.taille', $sort_order);
    } elseif ($sort_by === 'nom_native') {
        $queryBuilder->orderBy('document_declarations.nom_native', $sort_order);
    } else {
        // Par défaut, trier par date_ordonnancement de la note
        $queryBuilder->orderBy('note_perceptions.date_ordonnancement', $sort_order);
    }

    // 📄 PAGINATION
    $documents = $queryBuilder->with([
            'declaration.departement', 
            'declaration.classeur'
        ])
        ->where('document_declarations.id_declaration', '>', 0) // S'assurer que la jointure est valide
        ->paginate($per_page, ['*'], 'page', $page);

    // TRANSFORMER LES DONNÉES
    $documents->getCollection()->transform(function ($doc) use ($query) {
        // Ajouter les infos de la note
        $doc->note_info = [
            'id' => $doc->note_id,
            'numero_serie' => $doc->numero_serie,
            'numero_article' => $doc->numero_article,
            'date_ordonnancement' => $doc->date_ordonnancement,
            'id_assujetti' => $doc->id_assujetti,
            'id_centre' => $doc->id_centre_ordonnancement,
            'id_classeur' => $doc->note_classeur_id,
            'statut' => $doc->note_statut
        ];

        // Ajouter les infos de déclaration si existantes
        if ($doc->declaration) {
            $doc->declaration_info = [
                'id' => $doc->declaration->id,
                'intitule' => $doc->declaration->intitule,
                'num_reference' => $doc->declaration->num_reference
            ];
            
            if ($doc->declaration->departement) {
                $doc->direction_nom = $doc->declaration->departement->nom;
            }
            
            if ($doc->declaration->classeur) {
                $doc->classeur_nom = $doc->declaration->classeur->nom_classeur;
            }
        }

        // Compter le nombre de documents par note (pour les stats)
        static $noteDocuments = [];
        $noteId = $doc->note_id;
        
        if (!isset($noteDocuments[$noteId])) {
            $noteDocuments[$noteId] = [
                'total' => 1,
                'avec_ocr' => !empty($doc->montext) ? 1 : 0
            ];
        }

        // Ajouter un extrait du texte OCR
        if ($query && $doc->montext) {
            $pos = stripos($doc->montext, $query);
            if ($pos !== false) {
                $start = max(0, $pos - 60);
                $length = min(strlen($doc->montext) - $start, 120);
                $doc->extrait = '...' . substr($doc->montext, $start, $length) . '...';
            }
        }

        // Statistiques du texte
        $doc->stats_texte = [
            'longueur' => strlen($doc->montext ?? ''),
            'mots' => str_word_count($doc->montext ?? ''),
            'pages_approx' => ceil(strlen($doc->montext ?? '') / 3000)
        ];

        return $doc;
    });

    // Agrégation des statistiques par note
    $notesAggregated = [];
    foreach ($documents as $doc) {
        $noteId = $doc->note_id;
        if (!isset($notesAggregated[$noteId])) {
            $notesAggregated[$noteId] = $doc;
            $notesAggregated[$noteId]->total_documents = 1;
            $notesAggregated[$noteId]->documents_avec_ocr = !empty($doc->montext) ? 1 : 0;
        } else {
            $notesAggregated[$noteId]->total_documents++;
            if (!empty($doc->montext)) {
                $notesAggregated[$noteId]->documents_avec_ocr++;
            }
        }
    }

    Log::info('Nombre de résultats: ' . $documents->total());

    return response()->json([
        'success' => true,
        'data' => array_values($notesAggregated),
        'pagination' => [
            'current_page' => $documents->currentPage(),
            'last_page' => $documents->lastPage(),
            'per_page' => $documents->perPage(),
            'total' => count($notesAggregated)
        ],
        'filters_applied' => [
            'query' => $query,
            'id_classeur' => $id_classeur,
            'id_assujetti' => $id_assujetti,
            'numero_article' => $numero_article,
            'date_debut' => $date_debut,
            'date_fin' => $date_fin,
            'sort_by' => $sort_by,
            'sort_order' => $sort_order
        ],
        'stats' => [
            'total_documents' => $documents->total()
        ]
    ]);
}





























}
