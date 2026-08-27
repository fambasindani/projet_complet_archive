<?php
// app/Http/Controllers/PublicStatsController.php

namespace App\Http\Controllers;

use App\Models\Declaration;
use App\Models\NotePerception;
use App\Models\Departement;
use App\Models\CentreOrdonnancement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicStatsController extends Controller
{
    /**
     * Statistiques globales pour la page d'accueil
     */
    public function getHomeStats()
    {
        try {
            // Stats Archivage Ordinaire (Declaration)
            $totalDocuments = Declaration::count();
            $documentsThisMonth = Declaration::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();
            
            // Stats Notes de Perception
            $totalNotes = NotePerception::count();
            $notesThisMonth = NotePerception::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();
            
            // Documents en traitement (statut = 'en_cours' ou 'actif' ?)
            $documentsEnTraitement = Declaration::where('statut', 'actif')->count();
            
            return response()->json([
                'success' => true,
                'data' => [
                    // Pour les 4 cartes de HomeScreen
                    'total_archives' => $totalDocuments + $totalNotes,
                    'archivages_mois' => $documentsThisMonth + $notesThisMonth,
                    'documents_traitement' => $documentsEnTraitement,
                    'taux_disponibilite' => 99.8,
                    
                    // Détails par module
                    'modules' => [
                        'ad' => [
                            'total' => $totalDocuments,
                            'monthly' => $documentsThisMonth,
                            'label' => 'Archivage Ordinaire'
                        ],
                        'np' => [
                            'total' => $totalNotes,
                            'monthly' => $notesThisMonth,
                            'label' => 'Notes de Perception'
                        ]
                    ],
                    'timestamp' => now()
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Statistiques détaillées pour Archivage Ordinaire (AD)
     * Basé sur le modèle Declaration
     */
   /**
 * Statistiques détaillées pour Archivage Ordinaire (AD)
 */
public function getAdStats()
{
    try {
        // Statistiques générales
        $total = Declaration::count();
        $actifs = Declaration::where('statut', 'actif')->count();
        $archives = Declaration::where('statut', 'archivé')->count();
        
        // Statistiques temporelles
        $today = Declaration::whereDate('created_at', today())->count();
        $week = Declaration::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count();
        $month = Declaration::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
        
        // SOLUTION 1: Utiliser avecCount (après avoir ajouté la relation)
        $topDirections = Departement::withCount(['declarations' => function($query) {
                $query->where('statut', 'actif');
            }])
            ->having('declarations_count', '>', 0)
            ->orderBy('declarations_count', 'desc')
            ->limit(5)
            ->get(['id', 'nom', 'sigle']);
        
        // Formater les résultats
        $topDirections = $topDirections->map(function($direction) {
            return [
                'id' => $direction->id,
                'nom' => $direction->nom,
                'sigle' => $direction->sigle,
                'total' => $direction->declarations_count
            ];
        });
        
        return response()->json([
            'success' => true,
            'data' => [
                'total_documents' => $total,
                'documents_actifs' => $actifs,
                'documents_archives' => $archives,
                'documents_aujourdhui' => $today,
                'documents_semaine' => $week,
                'documents_mois' => $month,
                'top_directions' => $topDirections
            ]
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur statistiques AD: ' . $e->getMessage()
        ], 500);
    }
}

    /**
     * Statistiques détaillées pour Notes de Perception (NP)
     * Basé sur le modèle NotePerception
     */
    public function getNpStats()
    {
        try {
            // Statistiques générales
            $total = NotePerception::count();
            $actives = NotePerception::where('statut', 'actif')->count();
            $archivees = NotePerception::where('statut', 'archivé')->count();
            
            // Statistiques temporelles
            $today = NotePerception::whereDate('created_at', today())->count();
            $week = NotePerception::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count();
            $month = NotePerception::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();
            $year = NotePerception::whereYear('created_at', now()->year)->count();
            
            // Top centres (via relation centre)
            $topCentres = CentreOrdonnancement::withCount(['notes' => function($query) {
                    $query->where('statut', 'actif');
                }])
                ->orderBy('notes_count', 'desc')
                ->limit(5)
                ->get(['id', 'nom']);
            
            // Ajouter le count
            $topCentres = $topCentres->map(function($centre) {
                return [
                    'id' => $centre->id,
                    'nom' => $centre->nom,
                    'total' => $centre->notes_count
                ];
            });
            
            // Statistiques par article budgétaire
            $statsParArticle = NotePerception::select('numero_article', DB::raw('count(*) as total'))
                ->whereNotNull('numero_article')
                ->groupBy('numero_article')
                ->orderBy('total', 'desc')
                ->limit(5)
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_notes' => $total,
                    'notes_actives' => $actives,
                    'notes_archivees' => $archivees,
                    'notes_aujourdhui' => $today,
                    'notes_semaine' => $week,
                    'notes_mois' => $month,
                    'notes_annee' => $year,
                    'top_centres' => $topCentres,
                    'top_articles' => $statsParArticle
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur statistiques NP: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Informations sur les modules
     */
    public function getModulesInfo()
    {
        try {
            return response()->json([
                'success' => true,
                'data' => [
                    [
                        'type' => 'ad',
                        'title' => 'Archivage Ordinaire',
                        'description' => 'Gestion des documents administratifs courants, correspondances, rapports, circulaires et documents généraux',
                        'color' => '#2E86C1',
                        'icon' => 'archive',
                        'stats' => [
                            'total' => Declaration::count(),
                            'monthly' => Declaration::whereMonth('created_at', now()->month)
                                ->whereYear('created_at', now()->year)
                                ->count()
                        ]
                    ],
                    [
                        'type' => 'np',
                        'title' => 'Archivage Note de Perception',
                        'description' => 'Gestion spécialisée des notes de perception, quittances, documents financiers et pièces comptables',
                        'color' => '#28B463',
                        'icon' => 'file-invoice',
                        'stats' => [
                            'total' => NotePerception::count(),
                            'monthly' => NotePerception::whereMonth('created_at', now()->month)
                                ->whereYear('created_at', now()->year)
                                ->count()
                        ]
                    ]
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur récupération modules'
            ], 500);
        }
    }

    /**
     * Activités récentes (limitées)
     */
    public function getRecentActivity()
    {
        try {
            // 5 dernières déclarations
            $recentDeclarations = Declaration::with('departement')
                ->latest()
                ->limit(5)
                ->get(['id', 'intitule', 'num_reference', 'created_at', 'id_direction', 'statut'])
                ->map(function($decl) {
                    return [
                        'id' => $decl->id,
                        'type' => 'declaration',
                        'titre' => $decl->intitule,
                        'reference' => $decl->num_reference,
                        'direction' => $decl->departement?->nom,
                        'date' => $decl->created_at,
                        'statut' => $decl->statut
                    ];
                });
            
            // 5 dernières notes
            $recentNotes = NotePerception::with('centre')
                ->latest()
                ->limit(5)
                ->get(['id', 'numero_serie', 'created_at', 'id_centre_ordonnancement', 'statut'])
                ->map(function($note) {
                    return [
                        'id' => $note->id,
                        'type' => 'note',
                        'titre' => 'Note N° ' . $note->numero_serie,
                        'centre' => $note->centre?->nom,
                        'date' => $note->created_at,
                        'statut' => $note->statut
                    ];
                });
            
            // Fusionner et trier par date
            $activities = $recentDeclarations->concat($recentNotes)
                ->sortByDesc('date')
                ->values()
                ->take(8);
            
            return response()->json([
                'success' => true,
                'data' => $activities
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur activités récentes'
            ], 500);
        }
    }

    /**
     * Santé du système
     */
    public function getSystemHealth()
    {
        try {
            $databaseStatus = 'connected';
            try {
                DB::connection()->getPdo();
            } catch (\Exception $e) {
                $databaseStatus = 'error';
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'status' => 'healthy',
                    'database' => $databaseStatus,
                    'timestamp' => now(),
                    'version' => '1.0.0'
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur santé système'
            ], 500);
        }
    }
}