<?php


namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\DocumentDeclaration;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
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
    try {
        $query = $request->input('query');
        $id_classeur = $request->input('id_classeur');
        $id_assujetti = $request->input('id_assujetti');
        $numero_article = $request->input('numero_article');
        $date_debut = $request->input('date_debut');
        $date_fin = $request->input('date_fin');
        $page = $request->input('page', 1);
        $per_page = $request->input('per_page', 10);
        $sort_by = $request->input('sort_by', 'date_ordonnancement');
        $sort_order = $request->input('sort_order', 'desc');

        Log::info('=== RECHERCHE AVANCEE NOTES ===');
        Log::info('Params:', compact('query', 'id_classeur', 'id_assujetti', 'numero_article'));

        $qb = NotePerception::query();

        $qb->with(['assujetti', 'classeur', 'emplacement', 'utilisateur']);

        if ($query) {
            $escaped = addcslashes($query, '%_\\');
            $qb->where(function ($q) use ($escaped) {
                $q->where('note_perceptions.numero_serie', 'LIKE', "%{$escaped}%")
                  ->orWhere('note_perceptions.numero_article', 'LIKE', "%{$escaped}%")
                  ->orWhereHas('assujetti', function ($sq) use ($escaped) {
                      $sq->where('nom_raison_sociale', 'LIKE', "%{$escaped}%");
                  })
                  ->orWhereHas('classeur', function ($sq) use ($escaped) {
                      $sq->where('nom_classeur', 'LIKE', "%{$escaped}%");
                  })
                  ->orWhereExists(function ($sq) use ($escaped) {
                      $sq->select(DB::raw(1))
                         ->from('document_note_perceptions as dd')
                         ->whereRaw('dd.id_note_perception = note_perceptions.id')
                         ->where(function ($wq) use ($escaped) {
                             $wq->where('dd.montext', 'LIKE', "%{$escaped}%")
                                ->orWhere('dd.nom_native', 'LIKE', "%{$escaped}%");
                         });
                  });
            });
        }

        if ($id_classeur) {
            $qb->where('note_perceptions.id_classeur', $id_classeur);
        }
        if ($id_assujetti) {
            $qb->where('note_perceptions.id_assujetti', $id_assujetti);
        }
        if ($numero_article) {
            $qb->where('note_perceptions.numero_article', 'LIKE', "%{$numero_article}%");
        }
        if ($date_debut) {
            $qb->whereDate('note_perceptions.date_ordonnancement', '>=', $date_debut);
        }
        if ($date_fin) {
            $qb->whereDate('note_perceptions.date_ordonnancement', '<=', $date_fin);
        }

        if ($sort_by === 'date_ordonnancement') {
            $qb->orderBy('note_perceptions.date_ordonnancement', $sort_order);
        } elseif ($sort_by === 'numero_serie') {
            $qb->orderBy('note_perceptions.numero_serie', $sort_order);
        } else {
            $qb->orderBy('note_perceptions.date_ordonnancement', $sort_order);
        }

        $notes = $qb->paginate($per_page, ['*'], 'page', $page);

        $notes->getCollection()->transform(function ($note) use ($query) {
            $allDocs = $note->documents()->get();

            $bestDoc = null;
            if ($query && $allDocs->count() > 0) {
                $escaped = addcslashes($query, '%_\\');
                $bestDoc = $allDocs->first(function ($doc) use ($escaped) {
                    return stripos($doc->montext ?? '', $escaped) !== false
                        || stripos($doc->nom_native ?? '', $escaped) !== false;
                });
            }
            if (!$bestDoc) {
                $bestDoc = $allDocs->first();
            }

            $note->doc_id = $bestDoc ? $bestDoc->id : null;
            $note->nom_fichier = $bestDoc ? $bestDoc->nom_fichier : null;
            $note->nom_native = $bestDoc ? $bestDoc->nom_native : null;
            $note->montext = $bestDoc ? $bestDoc->montext : null;
            $note->taille = $bestDoc ? $bestDoc->taille : null;
            $note->assujetti_nom = $note->assujetti ? $note->assujetti->nom_raison_sociale : '—';
            $note->classeur_nom = $note->classeur ? $note->classeur->nom_classeur : '—';

            // Ajouter un extrait du texte OCR
            $montext = $bestDoc ? $bestDoc->montext : null;
            if ($query && $montext) {
                $pos = stripos($montext, $query);
                if ($pos !== false) {
                    $start = max(0, $pos - 60);
                    $length = min(strlen($montext) - $start, 120);
                    $note->extrait = '...' . substr($montext, $start, $length) . '...';
                } else {
                    $note->extrait = substr($montext, 0, 150) . '...';
                }
            } else {
                $note->extrait = null;
            }

            $note->note_info = [
                'id' => $note->id,
                'numero_serie' => $note->numero_serie,
                'numero_article' => $note->numero_article,
                'date_ordonnancement' => $note->date_ordonnancement,
                'id_assujetti' => $note->id_assujetti,
                'id_classeur' => $note->id_classeur,
                'id_centre' => $note->id_centre_ordonnancement,
            ];
            return $note;
        });

        $response = [
            'success' => true,
            'data' => $notes->items(),
            'pagination' => [
                'current_page' => $notes->currentPage(),
                'last_page' => $notes->lastPage(),
                'per_page' => $notes->perPage(),
                'total' => $notes->total(),
            ]
        ];

        return response(json_encode($response, JSON_INVALID_UTF8_SUBSTITUTE | JSON_UNESCAPED_UNICODE), 200, [
            'Content-Type' => 'application/json',
        ]);
    } catch (\Exception $e) {
        Log::error('Erreur recherche notes: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la recherche: ' . $e->getMessage()
        ], 500);
    }
}












}
