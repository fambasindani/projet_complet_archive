<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Departement;
use App\Models\Classeur;
use App\Models\Declaration;
use App\Models\Utilisateur;
use Carbon\Carbon;

class DashboardController extends Controller
{
   


public function getNotePerceptionCountByCentre()
{
    $resultats = DB::table('note_perceptions')
        ->join('centre_ordonnancements', 'note_perceptions.id_centre_ordonnancement', '=', 'centre_ordonnancements.id')
        ->where('note_perceptions.statut', 1) // Condition ajoutée
        ->select(
            'centre_ordonnancements.id as id_centre',
            'centre_ordonnancements.nom as centre_ordonnancement',
            DB::raw('COUNT(note_perceptions.id) as total')
        )
        ->groupBy('centre_ordonnancements.id', 'centre_ordonnancements.nom')
        ->orderByDesc('total')
        ->get();

    return response()->json($resultats);
}


public function getNotePerceptionCountByCentre_id($id)
{
    $resultats = DB::table('note_perceptions')
        ->join('centre_ordonnancements', 'note_perceptions.id_centre_ordonnancement', '=', 'centre_ordonnancements.id')
        ->where('note_perceptions.statut', 1) // Condition ajoutée
        ->where('note_perceptions.id_ministere', $id) // Ajout de la condition pour le filtre
        ->select(
            'centre_ordonnancements.id as id_centre',
            'centre_ordonnancements.nom as centre_ordonnancement',
            'note_perceptions.id_ministere', // Inclusion de id_ministere dans la sélection
            DB::raw('COUNT(note_perceptions.id) as total')
        )
        ->groupBy('centre_ordonnancements.id', 'centre_ordonnancements.nom', 'note_perceptions.id_ministere') // Ajout de id_ministere dans le groupement
        ->orderByDesc('total')
        ->get();

    return response()->json($resultats);
}






















public function getDeclarationSummary()
{
    $summary = DB::table('declarations')
        ->join('classeurs', 'declarations.id_classeur', '=', 'classeurs.id')
        ->select(
            'classeurs.id as id_classeur',
            'classeurs.nom_classeur',
            DB::raw('COUNT(declarations.id) as total'),
            DB::raw('MAX(declarations.created_at) as last_created_at')
        )
        ->groupBy('classeurs.id', 'classeurs.nom_classeur')
        ->orderByDesc('total')
        ->get()
        ->map(function ($item) {
            return [
                'nom_classeur' => $item->nom_classeur,
                'id_classeur' => $item->id_classeur,
                'created_at' => $item->last_created_at,
                'total' => $item->total
            ];
        });

    return response()->json($summary);
}






    public function declarationSearch(Request $request)
    {
        $query = DB::table('declarations')
            ->join('classeurs', 'declarations.id_classeur', '=', 'classeurs.id')
            ->join('directions', 'declarations.id_direction', '=', 'directions.id')
            ->select('classeurs.nom_classeur', "classeurs.id_classeur",  DB::raw('COUNT(declarations.id) as total'))
            ->groupBy('classeurs.nom_classeur');

        // 🔍 Filtrer par direction si fourni
        if ($request->has('direction_id')) {
            $query->where('declarations.id_direction', $request->direction_id);
        }

        // 🔍 Filtrer par classeur si fourni
        if ($request->has('classeur_id')) {
            $query->where('declarations.id_classeur', $request->classeur_id);
        }

        $summary = $query->orderBy('total', 'desc')->get();

        return response()->json($summary);
    }


 public function searchDeclaration(Request $request)
{
    $nom_classeur = $request->input('nom_classeur');
    $id_direction = $request->input('id_direction');

    $query = DB::table('declarations')
        ->join('classeurs', 'declarations.id_classeur', '=', 'classeurs.id')
        ->join('directions', 'declarations.id_direction', '=', 'directions.id')
        ->where('classeurs.nom_classeur', 'LIKE', "%{$nom_classeur}%")
        ->where('declarations.id_direction', $id_direction);

    $results = $query->select(
        'declarations.id',
        'classeurs.nom_classeur',
        'classeurs.id as id_classeur',
        'directions.nom',
        'declarations.created_at'
    )->get();

    $total = $query->count();

    return response()->json([
        'total' => $total,
        'declarations' => $results
    ]);
}






public function Searchdeclarationx(Request $request)
{
    $query = DB::table('declarations')
        ->join('classeurs', 'declarations.id_classeur', '=', 'classeurs.id')
        ->join('directions', 'declarations.id_direction', '=', 'directions.id')
        ->select(
            'declarations.id_direction', // ID de la direction
            'classeurs.nom_classeur',    // Nom du classeur
            'classeurs.id as id_classeur', // ID du classeur
            'directions.nom as nom_direction', // Nom de la direction
            DB::raw('COUNT(declarations.id) as total')
        )
        ->groupBy('declarations.id_direction', 'classeurs.nom_classeur', 'classeurs.id', 'directions.nom');

    // 🔍 Filtrer uniquement si direction_id et nom_classeur sont fournis
    if ($request->has('direction_id') && $request->has('nom_classeur')) {
        $query->where('declarations.id_direction', $request->direction_id)
              ->where('classeurs.nom_classeur', $request->nom_classeur);
    }

    $summary = $query->orderBy('total', 'desc')->get();

    return response()->json($summary);
}

/* {
  "direction_id": 2,
  "classeur_id": 17
} */
























public function statistics()
{
    // Total des documents (déclarations)
    $total_documents = Declaration::count();
    
    // ✅ Total des classeurs ayant au moins une déclaration (donc des documents)
    $total_classificateurs = Classeur::whereHas('declarations')->count();
    
    // Total des directions (départements) - inchangé
    $total_directions = Departement::count();
    
    // Documents par statut
    $documents_actifs = Declaration::where('statut', 'actif')->count();
    $documents_archives = Declaration::where('statut', 'archivé')->count();
    
    // Documents aujourd'hui
    $documents_aujourdhui = Declaration::whereDate('created_at', Carbon::today())->count();
    
    // Documents cette semaine
    $documents_semaine = Declaration::whereBetween('created_at', [
        Carbon::now()->startOfWeek(),
        Carbon::now()->endOfWeek()
    ])->count();
    
    // Documents ce mois
    $documents_mois = Declaration::whereMonth('created_at', Carbon::now()->month)
        ->whereYear('created_at', Carbon::now()->year)
        ->count();
    
    // Top 5 classificateurs (déjà basé sur les déclarations)
    $top_classificateurs = Declaration::select(
            'id_classeur',
            DB::raw('count(*) as total'),
            DB::raw('MAX(created_at) as dernier_ajout')
        )
        ->with('classeur:id,nom_classeur,created_at')
        ->groupBy('id_classeur')
        ->orderBy('total', 'desc')
        ->limit(5)
        ->get()
        ->map(function($item) {
            return [
                'id' => $item->id_classeur,
                'nom' => $item->classeur->nom_classeur ?? 'N/A',
                'total' => $item->total,
                'dernier_ajout' => $item->dernier_ajout,
                'created_at' => $item->classeur->created_at ?? null
            ];
        });
    
    // Top 5 directions (déjà basé sur les déclarations)
    $top_directions = Declaration::select(
            'id_direction',
            DB::raw('count(*) as total')
        )
        ->with('departement:id,nom,sigle')
        ->groupBy('id_direction')
        ->orderBy('total', 'desc')
        ->limit(5)
        ->get()
        ->map(function($item) {
            return [
                'id' => $item->id_direction,
                'nom' => $item->departement->nom ?? 'N/A',
                'sigle' => $item->departement->sigle ?? 'N/A',
                'total' => $item->total
            ];
        });
    
    return response()->json([
        'success' => true,
        'data' => [
            'total_documents' => $total_documents,
            'total_classificateurs' => $total_classificateurs,
            'total_directions' => $total_directions,
            'documents_actifs' => $documents_actifs,
            'documents_archives' => $documents_archives,
            'documents_aujourdhui' => $documents_aujourdhui,
            'documents_semaine' => $documents_semaine,
            'documents_mois' => $documents_mois,
            'top_classificateurs' => $top_classificateurs,
            'top_directions' => $top_directions
        ]
    ]);
}





public function classifiers(Request $request)
{
    $query = Classeur::query();
    
    // 🔒 Ne garder que les classeurs ayant au moins une déclaration (document)
    $query->whereHas('declarations');
    
    // Filtre par recherche sur le nom du classeur
    if ($request->filled('search')) {
        $query->where('nom_classeur', 'like', '%' . $request->search . '%');
    }
    
    // Filtre par direction
    if ($request->filled('id_direction')) {
        $query->whereHas('declarations', function($q) use ($request) {
            $q->where('id_direction', $request->id_direction);
        });
    }
    
    $perPage = $request->get('per_page', 12);
    
    $classificateurs = $query->withCount(['declarations as total' => function($q) use ($request) {
        if ($request->filled('id_direction')) {
            $q->where('id_direction', $request->id_direction);
        }
        $this->applyPeriodFilter($q, $request->periode);
    }])
    ->with(['declarations.departement'])
    ->orderBy('total', 'desc')
    ->paginate($perPage);
    
    foreach ($classificateurs as $classeur) {
        // Dernier document avec les mêmes filtres
        $dernierQuery = Declaration::where('id_classeur', $classeur->id);
        if ($request->filled('id_direction')) {
            $dernierQuery->where('id_direction', $request->id_direction);
        }
        $this->applyPeriodFilter($dernierQuery, $request->periode);
        
        $dernier = $dernierQuery->orderBy('created_at', 'desc')->first();
        $classeur->dernier_document = $dernier ? $dernier->created_at->toIso8601String() : null;
        $classeur->total = $classeur->total ?? 0;
        
        // Directions associées (sans filtre)
        $directions = Declaration::where('id_classeur', $classeur->id)
            ->with('departement')
            ->select('id_direction')
            ->distinct()
            ->get()
            ->pluck('departement')
            ->filter();
        
        $classeur->directions = $directions->values();
        $classeur->directions_count = $directions->count();
        $classeur->directions_noms = $directions->pluck('nom')->implode(', ');
    }
    
    return response()->json([
        'success' => true,
        'data' => $classificateurs
    ]);
}


private function applyPeriodFilter($query, $periode)
{
    if (empty($periode) || $periode === 'all') {
        return;
    }

    switch ($periode) {
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






// private function applyPeriodFilter($query, $periode)
// {
//     if (empty($periode) || $periode === 'all') return;
    
//     switch ($periode) {
//         case 'today':
//             $query->whereDate('created_at', Carbon::today());
//             break;
//         case 'week':
//             $query->whereBetween('created_at', [
//                 Carbon::now()->startOfWeek(),
//                 Carbon::now()->endOfWeek()
//             ]);
//             break;
//         case 'month':
//             $query->whereMonth('created_at', Carbon::now()->month)
//                   ->whereYear('created_at', Carbon::now()->year);
//             break;
//         case 'year':
//             $query->whereYear('created_at', Carbon::now()->year);
//             break;
//     }
// }

    /**
     * 📁 CLASSIFICATEURS PAR DIRECTION
     */
    public function classifiersByDirection($id)
    {
        $direction = Departement::findOrFail($id); // Changé de Direction à Departement
        
        $classificateurs = Classeur::withCount(['declarations as total' => function($q) use ($id) {
                $q->where('id_direction', $id);
            }])
            ->having('total', '>', 0)
            ->orderBy('total', 'desc')
            ->get()
            ->map(function($classeur) {
                return [
                    'id' => $classeur->id,
                    'nom' => $classeur->nom_classeur,
                    'total' => $classeur->total ?? 0
                ];
            });
        
        return response()->json([
            'success' => true,
            'data' => [
                'direction' => [
                    'id' => $direction->id,
                    'nom' => $direction->nom,
                    'sigle' => $direction->sigle
                ],
                'classificateurs' => $classificateurs,
                'total' => $classificateurs->count()
            ]
        ]);
    }

    /**
     * 🔍 RECHERCHE AVANCÉE
     */
    public function advancedSearch(Request $request)
    {
        $validator = validator($request->all(), [
            'nom_classeur' => 'nullable|string|max:255',
            'id_direction' => 'nullable|exists:departements,id', // Changé
            'periode' => 'nullable|in:all,today,week,month,year',
            'statut' => 'nullable|in:actif,archivé,tous',
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
        $query = Declaration::with(['classeur', 'departement', 'utilisateur']); // Changé
        
        // Filtre par classeur
        if ($request->filled('nom_classeur')) {
            $query->whereHas('classeur', function($q) use ($request) {
                $q->where('nom_classeur', 'like', '%' . $request->nom_classeur . '%');
            });
        }
        
        // Filtre par direction
        if ($request->filled('id_direction')) {
            $query->where('id_direction', $request->id_direction);
        }
        
        // Filtre par statut
        if ($request->filled('statut') && $request->statut !== 'tous') {
            $query->where('statut', $request->statut);
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
        
        // Grouper les résultats par classeur
        $grouped = $results->groupBy('id_classeur')->map(function($items, $key) {
            $classeur = $items->first()->classeur;
            return [
                'id' => $key, // Changé pour correspondre au frontend
                'id_classeur' => $key,
                'nom_classeur' => $classeur->nom_classeur ?? 'N/A',
                'total' => $items->count(),
                'documents' => $items->map(function($doc) {
                    return [
                        'id' => $doc->id,
                        'intitule' => $doc->intitule,
                        'num_reference' => $doc->num_reference,
                        'num_declaration' => $doc->num_declaration,
                        'date_creation' => $doc->date_creation,
                        'direction' => $doc->departement->nom ?? null, // Changé
                        'utilisateur' => $doc->utilisateur ? 
                            $doc->utilisateur->prenom . ' ' . $doc->utilisateur->nom : null
                    ];
                })
            ];
        })->values();
        
        return response()->json([
            'success' => true,
            'data' => [
                'classificateurs' => $grouped,
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
     * 📊 STATISTIQUES DÉTAILLÉES PAR DIRECTION
     */
    public function directionStats($id)
    {
        $direction = Departement::findOrFail($id); // Changé
        
        // Statistiques globales
        $total_documents = Declaration::where('id_direction', $id)->count();
        
        // Documents par mois (pour graphique)
        $documents_par_mois = Declaration::where('id_direction', $id)
            ->select(
                DB::raw('YEAR(created_at) as annee'),
                DB::raw('MONTH(created_at) as mois'),
                DB::raw('count(*) as total')
            )
            ->groupBy('annee', 'mois')
            ->orderBy('annee', 'desc')
            ->orderBy('mois', 'desc')
            ->limit(6)
            ->get();
        
        // Top classeurs
        $top_classeurs = Declaration::where('id_direction', $id)
            ->select('id_classeur', DB::raw('count(*) as total'))
            ->with('classeur:id,nom_classeur')
            ->groupBy('id_classeur')
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get()
            ->map(function($item) {
                return [
                    'id' => $item->id_classeur,
                    'nom' => $item->classeur->nom_classeur ?? 'N/A',
                    'total' => $item->total
                ];
            });
        
        // Utilisateurs actifs
        $utilisateurs_actifs = Declaration::where('id_direction', $id)
            ->select('id_user', DB::raw('count(*) as total'))
            ->with('utilisateur:id,nom,prenom,email')
            ->groupBy('id_user')
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get()
            ->map(function($item) {
                return [
                    'id' => $item->id_user,
                    'nom' => $item->utilisateur->nom ?? 'N/A',
                    'prenom' => $item->utilisateur->prenom ?? 'N/A',
                    'email' => $item->utilisateur->email ?? 'N/A',
                    'total' => $item->total
                ];
            });
        
        return response()->json([
            'success' => true,
            'data' => [
                'direction' => [
                    'id' => $direction->id,
                    'nom' => $direction->nom,
                    'sigle' => $direction->sigle
                ],
                'total_documents' => $total_documents,
                'documents_par_mois' => $documents_par_mois,
                'top_classeurs' => $top_classeurs,
                'utilisateurs_actifs' => $utilisateurs_actifs
            ]
        ]);
    }

    /**
     * ⏱️ ACTIVITÉS RÉCENTES
     */
    public function recentActivities()
    {
        $activities = Declaration::with(['utilisateur', 'classeur', 'departement']) // Changé
            ->orderBy('created_at', 'desc')
            ->limit(15)
            ->get()
            ->map(function($declaration) {
                return [
                    'id' => $declaration->id,
                    'type' => 'document',
                    'action' => 'Création',
                    'document' => $declaration->intitule ?? 'Sans titre',
                    'reference' => $declaration->num_reference,
                    'classeur' => $declaration->classeur->nom_classeur ?? 'N/A',
                    'direction' => $declaration->departement->sigle ?? 'N/A', // Changé
                    'direction_nom' => $declaration->departement->nom ?? 'N/A', // Ajouté
                    'utilisateur' => $declaration->utilisateur ? 
                        $declaration->utilisateur->prenom . ' ' . $declaration->utilisateur->nom : 'N/A',
                    'created_at' => $declaration->created_at,
                    'created_at_humain' => $declaration->created_at->diffForHumans()
                ];
            });
        
        return response()->json([
            'success' => true,
            'data' => $activities
        ]);
    }




}
