<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Departement;
use App\Models\MonUtilisateur;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Helpers\LogHelper;

class DepartementController extends Controller
{


    // Liste des directions
    public function index(Request $request)
    {
        $query = Departement::withCount(['MonUtilisateurs as users_count']);
        
        // Recherche
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('sigle', 'like', "%{$search}%")
                  ->orWhere('nom', 'like', "%{$search}%");
            });
        }
        
        $perPage = $request->get('per_page', 10);
        $directions = $query->orderBy('id', 'desc')->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $directions,
            'message' => 'Liste des directions récupérée avec succès'
        ]);
    }
    
    // Créer une direction
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'sigle' => 'required|string|max:10|unique:departements',
            'nom' => 'required|string|max:100'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        $direction = Departement::create([
            'sigle' => strtoupper($request->sigle),
            'nom' => $request->nom,
            'datecreation' => now()
        ]);

        LogHelper::create('departements', $direction->id, 'Création de la direction : ' . $direction->nom . ' (' . $direction->sigle . ')');
        
        return response()->json([
            'success' => true,
            'data' => $direction,
            'message' => 'Direction créée avec succès'
        ], 201);
    }
    
    // Voir les détails d'une direction
    public function show($id)
    {
        $direction = Departement::with('MonUtilisateurs')->find($id);
        
        if (!$direction) {
            return response()->json([
                'success' => false,
                'message' => 'Direction non trouvée'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $direction
        ]);
    }
    
    // Modifier une direction
    public function update(Request $request, $id)
    {
        $direction = Departement::find($id);
        
        if (!$direction) {
            return response()->json([
                'success' => false,
                'message' => 'Direction non trouvée'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'sigle' => 'required|string|max:10|unique:departements,sigle,' . $id,
            'nom' => 'required|string|max:100'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        $direction->update([
            'sigle' => strtoupper($request->sigle),
            'nom' => $request->nom
        ]);

        LogHelper::update('departements', $direction->id, 'Modification de la direction : ' . $direction->nom . ' (' . $direction->sigle . ')');
        
        $direction->load('MonUtilisateurs');
        
        return response()->json([
            'success' => true,
            'data' => $direction,
            'message' => 'Direction mise à jour avec succès'
        ]);
    }
    
    // Supprimer une direction
    public function destroy($id)
    {
        $direction = Departement::find($id);
        
        if (!$direction) {
            return response()->json([
                'success' => false,
                'message' => 'Direction non trouvée'
            ], 404);
        }
        
        // Vérifier si la direction a des utilisateurs assignés
        if ($direction->MonUtilisateurs()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer cette direction car elle a des utilisateurs assignés'
            ], 403);
        }
        
        $direction->delete();

        LogHelper::delete('departements', $id, 'Suppression de la direction : ' . $direction->nom . ' (' . $direction->sigle . ')');
        
        return response()->json([
            'success' => true,
            'message' => 'Direction supprimée avec succès'
        ]);
    }
    
    // Obtenir les détails complets d'une direction
    public function getWithDetails($id)
    {
        $direction = Departement::with('MonUtilisateurs')->find($id);
        
        if (!$direction) {
            return response()->json([
                'success' => false,
                'message' => 'Direction non trouvée'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $direction
        ]);
    }
    
    // Obtenir les utilisateurs disponibles pour une direction
    public function getAvailableUsers($id)
    {
        $direction = Departement::find($id);
        
        if (!$direction) {
            return response()->json([
                'success' => false,
                'message' => 'Direction non trouvée'
            ], 404);
        }
        
        // Utilisateurs déjà assignés à cette direction
        $assignedUserIds = DB::table('direction_user')
            ->where('direction_id', $id)
            ->pluck('user_id');
        
        // Utilisateurs disponibles (non assignés)
        $availableUsers = MonUtilisateur::whereNotIn('id', $assignedUserIds)
            ->where('statut', 'active')
            ->select('id', 'nom', 'prenom', 'email', 'statut')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'departement' => $direction,
                'utilisateurs_disponibles' => $availableUsers,
                'nombre_affectés' => count($assignedUserIds),
                'nombre_disponibles' => $availableUsers->count()
            ]
        ]);
    }
    
    // Assigner un utilisateur à une direction
    public function assignUser($directionId, $userId)
    {
        $direction = Departement::find($directionId);
        
        if (!$direction) {
            return response()->json([
                'success' => false,
                'message' => 'Direction non trouvée'
            ], 404);
        }
        
        $user = MonUtilisateur::find($userId);
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }
        
        // Vérifier si l'utilisateur est déjà assigné
        $exists = DB::table('direction_user')
            ->where('direction_id', $directionId)
            ->where('user_id', $userId)
            ->exists();
        
        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Cet utilisateur est déjà assigné à cette direction'
            ], 409);
        }
        
        // Assigner l'utilisateur
        $direction->MonUtilisateurs()->attach($userId);
        
        $direction->load('MonUtilisateurs');
        
        return response()->json([
            'success' => true,
            'data' => $direction,
            'message' => 'Utilisateur assigné à la direction avec succès'
        ]);
    }
    
    // Retirer un utilisateur d'une direction
    public function removeUser($directionId, $userId)
    {
        $direction = Departement::find($directionId);
        
        if (!$direction) {
            return response()->json([
                'success' => false,
                'message' => 'Direction non trouvée'
            ], 404);
        }
        
        $user = MonUtilisateur::find($userId);
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }
        
        // Retirer l'utilisateur
        $direction->MonUtilisateurs()->detach($userId);
        
        $direction->load('MonUtilisateurs');
        
        return response()->json([
            'success' => true,
            'data' => $direction,
            'message' => 'Utilisateur retiré de la direction avec succès'
        ]);
    }
    
    // Statistiques des directions
  public function statdepartement()
{
    $stats = DB::table('departements')
        ->leftJoin('direction_user', 'departements.id', '=', 'direction_user.direction_id')
        ->select(
            'departements.id',
            'departements.sigle',
            'departements.nom',
            DB::raw('COUNT(DISTINCT direction_user.user_id) as users_count')
        )
        ->groupBy('departements.id', 'departements.sigle', 'departements.nom')
        ->get();

    $totalDirections = Departement::count();
    $directionsWithUsers = $stats->where('users_count', '>', 0)->count();
    $totalAssignments = $stats->sum('users_count');

    return response()->json([
        'success' => true,
        'data' => [
            'stats' => $stats,
            'total_directions' => $totalDirections,
            'directions_avec_utilisateurs' => $directionsWithUsers,
            'total_affectations' => $totalAssignments
        ]
    ]);
}








































































}

