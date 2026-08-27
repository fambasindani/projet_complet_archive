<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use App\Models\NotePerception;
use App\Models\CentreOrdonnancement;
use App\Models\ArticleBudgetaire;
use App\Models\Assujetti;
use App\Models\Emplacement;

class DashboardNoteController extends Controller
{
    /**
     * 📊 STATISTIQUES GLOBALES
     */
    public function statistics()
    {
        // Statistiques de base
        $total_notes = NotePerception::where('statut', 1)->count();
        $total_centres = CentreOrdonnancement::where('statut', '1')->count();
        $total_articles = ArticleBudgetaire::where('statut', 1)->count();
        $total_assujettis = Assujetti::where('statut', 1)->count();
        $total_emplacements = Emplacement::where('statut', true)->count();

        // Notes par statut
        $notes_actives = NotePerception::where('statut', 1)->count();
        $notes_archivees = NotePerception::where('statut', 0)->count();

        // Notes aujourd'hui
        $notes_aujourdhui = NotePerception::whereDate('created_at', Carbon::today())
            ->where('statut', 1)
            ->count();

        // Notes cette semaine
        $notes_semaine = NotePerception::whereBetween('created_at', [
                Carbon::now()->startOfWeek(),
                Carbon::now()->endOfWeek()
            ])
            ->where('statut', 1)
            ->count();

        // Notes ce mois
        $notes_mois = NotePerception::whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->where('statut', 1)
            ->count();

        // Notes cette année
        $notes_annee = NotePerception::whereYear('created_at', Carbon::now()->year)
            ->where('statut', 1)
            ->count();

        // Top 5 centres
        $top_centres = NotePerception::where('statut', 1)
            ->select(
                'id_centre_ordonnancement',
                DB::raw('count(*) as total'),
                DB::raw('MAX(created_at) as dernier_ajout')
            )
            ->with('centre:id,nom,description')
            ->groupBy('id_centre_ordonnancement')
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get()
            ->map(function($item) {
                return [
                    'id' => $item->id_centre_ordonnancement,
                    'nom' => $item->centre->nom ?? 'N/A',
                    'description' => $item->centre->description ?? '',
                    'total' => $item->total,
                    'dernier_ajout' => $item->dernier_ajout
                ];
            });

        // Top 5 articles (basé sur numero_article)
        $top_articles = NotePerception::where('statut', 1)
            ->whereNotNull('numero_article')
            ->select(
                'numero_article',
                DB::raw('count(*) as total')
            )
            ->groupBy('numero_article')
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get()
            ->map(function($item) {
                // Chercher les infos de l'article dans article_budgetaires
                $article = ArticleBudgetaire::where('article_budgetaire', $item->numero_article)->first();
                return [
                    'id' => $article->id ?? null,
                    'code' => $item->numero_article,
                    'nom' => $article->nom ?? 'Article inconnu',
                    'total' => $item->total
                ];
            });

        // Top 5 assujettis
        $top_assujettis = NotePerception::where('statut', 1)
            ->select(
                'id_assujetti',
                DB::raw('count(*) as total')
            )
            ->with('assujetti:id,nom_raison_sociale,numero_nif')
            ->groupBy('id_assujetti')
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get()
            ->map(function($item) {
                return [
                    'id' => $item->id_assujetti,
                    'nom' => $item->assujetti->nom_raison_sociale ?? 'N/A',
                    'nif' => $item->assujetti->numero_nif ?? 'N/A',
                    'total' => $item->total
                ];
            });

        // Répartition par classeur
        $par_classeur = NotePerception::where('statut', 1)
            ->select(
                'id_classeur',
                DB::raw('count(*) as total')
            )
            ->with('classeur:id,nom_classeur')
            ->groupBy('id_classeur')
            ->orderBy('total', 'desc')
            ->get()
            ->map(function($item) {
                return [
                    'id' => $item->id_classeur,
                    'nom' => $item->classeur->nom_classeur ?? 'N/A',
                    'total' => $item->total
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'total_notes' => $total_notes,
                'total_centres' => $total_centres,
                'total_articles' => $total_articles,
                'total_assujettis' => $total_assujettis,
                'total_emplacements' => $total_emplacements,
                'notes_actives' => $notes_actives,
                'notes_archivees' => $notes_archivees,
                'notes_aujourdhui' => $notes_aujourdhui,
                'notes_semaine' => $notes_semaine,
                'notes_mois' => $notes_mois,
                'notes_annee' => $notes_annee,
                'top_centres' => $top_centres,
                'top_articles' => $top_articles,
                'top_assujettis' => $top_assujettis,
                'par_classeur' => $par_classeur
            ]
        ]);
    }

    /**
     * 📁 TOUS LES CENTRES AVEC COMPTAGE
     */
    public function centres(Request $request)
    {
        $query = CentreOrdonnancement::where('statut', '1');
        
        // Filtre par recherche
        if ($request->has('search') && !empty($request->search)) {
            $query->where(function($q) use ($request) {
                $q->where('nom', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }
        
        // Pagination
        $perPage = $request->get('per_page', 12);
        
        $centres = $query->withCount(['notes as total' => function($q) use ($request) {
                $q->where('statut', 1);
                
                // Filtre par article (numero_article)
                if ($request->has('numero_article') && !empty($request->numero_article)) {
                    $q->where('numero_article', $request->numero_article);
                }
                
                // Filtre par classeur
                if ($request->has('id_classeur') && !empty($request->id_classeur)) {
                    $q->where('id_classeur', $request->id_classeur);
                }
                
                // Filtre par assujetti
                if ($request->has('id_assujetti') && !empty($request->id_assujetti)) {
                    $q->where('id_assujetti', $request->id_assujetti);
                }
                
                // Filtre par période
                if ($request->has('periode')) {
                    switch($request->periode) {
                        case 'today':
                            $q->whereDate('created_at', Carbon::today());
                            break;
                        case 'week':
                            $q->whereBetween('created_at', [
                                Carbon::now()->startOfWeek(),
                                Carbon::now()->endOfWeek()
                            ]);
                            break;
                        case 'month':
                            $q->whereMonth('created_at', Carbon::now()->month)
                              ->whereYear('created_at', Carbon::now()->year);
                            break;
                        case 'year':
                            $q->whereYear('created_at', Carbon::now()->year);
                            break;
                    }
                }
            }])
            ->orderBy('total', 'desc')
            ->paginate($perPage);
        
        // Enrichir les données
        foreach ($centres as $centre) {
            // Dernière note
            $derniere = NotePerception::where('id_centre_ordonnancement', $centre->id)
                ->where('statut', 1)
                ->orderBy('created_at', 'desc')
                ->first();
            
            $centre->derniere_note = $derniere ? $derniere->created_at : null;
            $centre->dernier_numero = $derniere ? $derniere->numero_serie : null;
            $centre->total = $centre->total ?? 0;
            
            // Répartition par article pour ce centre
            $centre->repartition_articles = NotePerception::where('id_centre_ordonnancement', $centre->id)
                ->where('statut', 1)
                ->whereNotNull('numero_article')
                ->select('numero_article', DB::raw('count(*) as total'))
                ->groupBy('numero_article')
                ->orderBy('total', 'desc')
                ->limit(3)
                ->get()
                ->map(function($item) {
                    $article = ArticleBudgetaire::where('article_budgetaire', $item->numero_article)->first();
                    return [
                        'code' => $item->numero_article,
                        'nom' => $article->nom ?? 'N/A',
                        'total' => $item->total
                    ];
                });
        }
        
        return response()->json([
            'success' => true,
            'data' => $centres
        ]);
    }

    /**
     * 📁 NOTES PAR CENTRE
     */
    public function notesByCentre($id, Request $request)
    {
        $centre = CentreOrdonnancement::findOrFail($id);
        
        $query = NotePerception::where('id_centre_ordonnancement', $id)
            ->where('statut', 1)
            ->with([
                'classeur:id,nom_classeur',
                'assujetti:id,nom_raison_sociale,numero_nif',
                'emplacement:id,nom_emplacement'
            ]);
        
        // Filtre par article (numero_article)
        if ($request->has('numero_article') && !empty($request->numero_article)) {
            $query->where('numero_article', $request->numero_article);
        }
        
        // Filtre par assujetti
        if ($request->has('id_assujetti') && !empty($request->id_assujetti)) {
            $query->where('id_assujetti', $request->id_assujetti);
        }
        
        // Filtre par classeur
        if ($request->has('id_classeur') && !empty($request->id_classeur)) {
            $query->where('id_classeur', $request->id_classeur);
        }
        
        // Filtre par période
        if ($request->has('periode')) {
            switch($request->periode) {
                case 'today':
                    $query->whereDate('created_at', Carbon::today());
                    break;
                case 'week':
                    $query->whereBetween('created_at', [
                        Carbon::now()->startOfWeek(),
                        Carbon::now()->endOfWeek()
                    ]);
                    break;
                case 'month':
                    $query->whereMonth('created_at', Carbon::now()->month)
                          ->whereYear('created_at', Carbon::now()->year);
                    break;
                case 'year':
                    $query->whereYear('created_at', Carbon::now()->year);
                    break;
            }
        }
        
        // Recherche par numéro de série
        if ($request->has('numero_serie') && !empty($request->numero_serie)) {
            $query->where('numero_serie', 'like', '%' . $request->numero_serie . '%');
        }
        
        // Pagination
        $perPage = $request->get('per_page', 15);
        $notes = $query->orderBy('created_at', 'desc')->paginate($perPage);
        
        // Enrichir les notes avec les infos d'article
        $notes->getCollection()->transform(function($note) {
            if ($note->numero_article) {
                $article = ArticleBudgetaire::where('article_budgetaire', $note->numero_article)->first();
                $note->article_info = $article ? [
                    'id' => $article->id,
                    'code' => $article->article_budgetaire,
                    'nom' => $article->nom
                ] : null;
            }
            return $note;
        });
        
        // Statistiques détaillées du centre
        $stats = [
            'total_notes' => NotePerception::where('id_centre_ordonnancement', $id)
                ->where('statut', 1)
                ->count(),
            'par_article' => NotePerception::where('id_centre_ordonnancement', $id)
                ->where('statut', 1)
                ->whereNotNull('numero_article')
                ->select('numero_article', DB::raw('count(*) as total'))
                ->groupBy('numero_article')
                ->orderBy('total', 'desc')
                ->get()
                ->map(function($item) {
                    $article = ArticleBudgetaire::where('article_budgetaire', $item->numero_article)->first();
                    return [
                        'code' => $item->numero_article,
                        'nom' => $article->nom ?? 'N/A',
                        'total' => $item->total
                    ];
                }),
            'par_assujetti' => NotePerception::where('id_centre_ordonnancement', $id)
                ->where('statut', 1)
                ->select('id_assujetti', DB::raw('count(*) as total'))
                ->with('assujetti:id,nom_raison_sociale')
                ->groupBy('id_assujetti')
                ->orderBy('total', 'desc')
                ->limit(5)
                ->get(),
            'par_classeur' => NotePerception::where('id_centre_ordonnancement', $id)
                ->where('statut', 1)
                ->select('id_classeur', DB::raw('count(*) as total'))
                ->with('classeur:id,nom_classeur')
                ->groupBy('id_classeur')
                ->orderBy('total', 'desc')
                ->limit(5)
                ->get(),
            'evolution_mensuelle' => NotePerception::where('id_centre_ordonnancement', $id)
                ->where('statut', 1)
                ->where('created_at', '>=', Carbon::now()->subMonths(6))
                ->select(
                    DB::raw('DATE_FORMAT(created_at, "%Y-%m") as mois'),
                    DB::raw('count(*) as total')
                )
                ->groupBy('mois')
                ->orderBy('mois')
                ->get()
        ];
        
        return response()->json([
            'success' => true,
            'data' => [
                'centre' => [
                    'id' => $centre->id,
                    'nom' => $centre->nom,
                    'description' => $centre->description
                ],
                'notes' => $notes,
                'statistiques' => $stats
            ]
        ]);
    }

    /**
     * 🔍 RECHERCHE AVANCÉE
     */
    public function advancedSearch(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom_centre' => 'nullable|string|max:255',
            'numero_article' => 'nullable|string|max:255',
            'id_classeur' => 'nullable|exists:classeurs,id',
            'id_assujetti' => 'nullable|exists:assujettis,id',
            'numero_serie' => 'nullable|string|max:255',
            'periode' => 'nullable|in:all,today,week,month,year',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date|after_or_equal:date_debut'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Requête de base
        $query = NotePerception::where('statut', 1)
            ->with([
                'centre:id,nom',
                'classeur:id,nom_classeur',
                'assujetti:id,nom_raison_sociale,numero_nif'
            ]);
        
        // Filtre par centre
        if ($request->filled('nom_centre')) {
            $query->whereHas('centre', function($q) use ($request) {
                $q->where('nom', 'like', '%' . $request->nom_centre . '%');
            });
        }
        
        // Filtre par article (numero_article)
        if ($request->filled('numero_article')) {
            $query->where('numero_article', 'like', '%' . $request->numero_article . '%');
        }
        
        // Filtre par classeur
        if ($request->filled('id_classeur')) {
            $query->where('id_classeur', $request->id_classeur);
        }
        
        // Filtre par assujetti
        if ($request->filled('id_assujetti')) {
            $query->where('id_assujetti', $request->id_assujetti);
        }
        
        // Filtre par numéro de série
        if ($request->filled('numero_serie')) {
            $query->where('numero_serie', 'like', '%' . $request->numero_serie . '%');
        }
        
        // Filtre par période
        if ($request->filled('periode') && $request->periode !== 'all') {
            switch($request->periode) {
                case 'today':
                    $query->whereDate('created_at', Carbon::today());
                    break;
                case 'week':
                    $query->whereBetween('created_at', [
                        Carbon::now()->startOfWeek(),
                        Carbon::now()->endOfWeek()
                    ]);
                    break;
                case 'month':
                    $query->whereMonth('created_at', Carbon::now()->month)
                          ->whereYear('created_at', Carbon::now()->year);
                    break;
                case 'year':
                    $query->whereYear('created_at', Carbon::now()->year);
                    break;
            }
        }
        
        // Filtre par dates personnalisées
        if ($request->filled('date_debut')) {
            $query->whereDate('created_at', '>=', $request->date_debut);
        }
        
        if ($request->filled('date_fin')) {
            $query->whereDate('created_at', '<=', $request->date_fin);
        }
        
        // Pagination
        $perPage = $request->get('per_page', 12);
        $results = $query->orderBy('created_at', 'desc')->paginate($perPage);
        
        // Enrichir avec les infos d'article
        $results->getCollection()->transform(function($note) {
            if ($note->numero_article) {
                $article = ArticleBudgetaire::where('article_budgetaire', $note->numero_article)->first();
                $note->article_info = $article ? [
                    'code' => $article->article_budgetaire,
                    'nom' => $article->nom
                ] : null;
            }
            return $note;
        });
        
        // Grouper les résultats par centre
        $grouped = $results->groupBy('id_centre_ordonnancement')->map(function($items, $key) {
            $centre = $items->first()->centre;
            return [
                'id' => $key,
                'id_centre' => $key,
                'nom_centre' => $centre->nom ?? 'N/A',
                'total' => $items->count(),
                'notes' => $items->map(function($note) {
                    return [
                        'id' => $note->id,
                        'numero_serie' => $note->numero_serie,
                        'numero_article' => $note->numero_article,
                        'article_info' => $note->article_info,
                        'date_ordonnancement' => $note->date_ordonnancement,
                        'date_enregistrement' => $note->date_enregistrement,
                        'classeur' => $note->classeur->nom_classeur ?? null,
                        'assujetti' => $note->assujetti ? [
                            'nom' => $note->assujetti->nom_raison_sociale,
                            'nif' => $note->assujetti->numero_nif
                        ] : null,
                        'created_at' => $note->created_at
                    ];
                })
            ];
        })->values();
        
        return response()->json([
            'success' => true,
            'data' => [
                'centres' => $grouped,
                'pagination' => [
                    'current_page' => $results->currentPage(),
                    'last_page' => $results->lastPage(),
                    'per_page' => $results->perPage(),
                    'total' => $results->total()
                ]
            ]
        ]);
    }

    /**
     * 📊 STATISTIQUES DÉTAILLÉES PAR CENTRE
     */
    public function centreStats($id)
    {
        $centre = CentreOrdonnancement::findOrFail($id);
        
        // Statistiques globales
        $total_notes = NotePerception::where('id_centre_ordonnancement', $id)
            ->where('statut', 1)
            ->count();
        
        // Notes par mois (pour graphique)
        $notes_par_mois = NotePerception::where('id_centre_ordonnancement', $id)
            ->where('statut', 1)
            ->select(
                DB::raw('YEAR(created_at) as annee'),
                DB::raw('MONTH(created_at) as mois'),
                DB::raw('count(*) as total')
            )
            ->groupBy('annee', 'mois')
            ->orderBy('annee', 'desc')
            ->orderBy('mois', 'desc')
            ->limit(12)
            ->get();
        
        // Répartition par article
        $par_article = NotePerception::where('id_centre_ordonnancement', $id)
            ->where('statut', 1)
            ->whereNotNull('numero_article')
            ->select('numero_article', DB::raw('count(*) as total'))
            ->groupBy('numero_article')
            ->orderBy('total', 'desc')
            ->get()
            ->map(function($item) {
                $article = ArticleBudgetaire::where('article_budgetaire', $item->numero_article)->first();
                return [
                    'code' => $item->numero_article,
                    'nom' => $article->nom ?? 'N/A',
                    'total' => $item->total
                ];
            });
        
        // Répartition par assujetti
        $par_assujetti = NotePerception::where('id_centre_ordonnancement', $id)
            ->where('statut', 1)
            ->select('id_assujetti', DB::raw('count(*) as total'))
            ->with('assujetti:id,nom_raison_sociale')
            ->groupBy('id_assujetti')
            ->orderBy('total', 'desc')
            ->limit(10)
            ->get();
        
        // Répartition par classeur
        $par_classeur = NotePerception::where('id_centre_ordonnancement', $id)
            ->where('statut', 1)
            ->select('id_classeur', DB::raw('count(*) as total'))
            ->with('classeur:id,nom_classeur')
            ->groupBy('id_classeur')
            ->orderBy('total', 'desc')
            ->get();
        
        // Évolution sur 12 mois
        $evolution = NotePerception::where('id_centre_ordonnancement', $id)
            ->where('statut', 1)
            ->where('created_at', '>=', Carbon::now()->subMonths(12))
            ->select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as mois'),
                DB::raw('count(*) as total')
            )
            ->groupBy('mois')
            ->orderBy('mois')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'centre' => [
                    'id' => $centre->id,
                    'nom' => $centre->nom,
                    'description' => $centre->description
                ],
                'total_notes' => $total_notes,
                'notes_par_mois' => $notes_par_mois,
                'par_article' => $par_article,
                'par_assujetti' => $par_assujetti,
                'par_classeur' => $par_classeur,
                'evolution' => $evolution
            ]
        ]);
    }

    /**
     * ⏱️ ACTIVITÉS RÉCENTES
     */
    public function recentActivities()
    {
        $activities = NotePerception::with([
                'centre:id,nom',
                'classeur:id,nom_classeur',
                'assujetti:id,nom_raison_sociale'
            ])
            ->where('statut', 1)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function($note) {
                // Chercher l'article
                $article = null;
                if ($note->numero_article) {
                    $article = ArticleBudgetaire::where('article_budgetaire', $note->numero_article)->first();
                }
                
                return [
                    'id' => $note->id,
                    'type' => 'note',
                    'action' => 'Création',
                    'numero_serie' => $note->numero_serie,
                    'centre' => $note->centre->nom ?? 'N/A',
                    'article' => $article ? $article->article_budgetaire . ' - ' . $article->nom : ($note->numero_article ?? 'N/A'),
                    'classeur' => $note->classeur->nom_classeur ?? 'N/A',
                    'assujetti' => $note->assujetti->nom_raison_sociale ?? 'N/A',
                    'date_ordonnancement' => $note->date_ordonnancement,
                    'created_at' => $note->created_at,
                    'created_at_humain' => $note->created_at->diffForHumans()
                ];
            });
        
        return response()->json([
            'success' => true,
            'data' => $activities
        ]);
    }

    /**
     * 📋 LISTE DES ARTICLES POUR FILTRES
     */
    public function getArticles()
    {
        $articles = ArticleBudgetaire::where('statut', 1)
            ->select('id', 'article_budgetaire as code', 'nom')
            ->orderBy('article_budgetaire')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $articles
        ]);
    }

    /**
     * 📋 LISTE DES ASSUJETTIS POUR FILTRES
     */
    public function getAssujettis()
    {
        $assujettis = Assujetti::where('statut', 1)
            ->select('id', 'nom_raison_sociale as nom', 'numero_nif')
            ->orderBy('nom_raison_sociale')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $assujettis
        ]);
    }

    /**
     * 📋 LISTE DES CLASSEURS POUR FILTRES
     */
    public function getClasseurs()
    {
        $classeurs = DB::table('classeurs')
            ->where('statut', true)
            ->select('id', 'nom_classeur as nom')
            ->orderBy('nom_classeur')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $classeurs
        ]);
    }
}