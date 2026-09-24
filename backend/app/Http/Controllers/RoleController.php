<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Helpers\LogHelper;

class RoleController extends Controller
{

     // Liste des rôles
 /*    public function index(Request $request)
    {
        $query = Role::withCount('MonUtilisateurs');
        
        // Recherche
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }
        
        $perPage = $request->get('per_page', 10);
        $roles = $query->orderBy('id', 'desc')->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $roles,
            'message' => 'Liste des rôles récupérée avec succès'
        ]);
    } */


    // Liste des rôles
public function index(Request $request)
{
    // AJOUTEZ 'permissions' DANS withCount POUR INCLURE LES RELATIONS
    $query = Role::with(['permissions:id,code,description'])
                ->withCount(['MonUtilisateurs as users_count', 'permissions']);
    
    // Recherche
    if ($request->has('search') && !empty($request->search)) {
        $search = $request->search;
        $query->where(function($q) use ($search) {
            $q->where('nom', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%");
        });
    }
    
    // Trier par date de création décroissante
    $query->orderBy('created_at', 'desc');
    
    $perPage = $request->get('per_page', 10);
    $roles = $query->paginate($perPage);
    
    return response()->json([
        'success' => true,
        'data' => $roles,
        'message' => 'Liste des rôles récupérée avec succès'
    ]);
}


      // Créer un rôle
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:50|unique:roles',
            'description' => 'nullable|string',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        DB::beginTransaction();
        try {
            $role = Role::create([
                'nom' => $request->nom,
                'description' => $request->description
            ]);
            
            // Assigner les permissions
            if ($request->has('permissions') && is_array($request->permissions)) {
                $role->permissions()->attach($request->permissions);
            }
            
            DB::commit();
            
            $role->load(['permissions', 'MonUtilisateurs']);

            LogHelper::create('roles', $role->id, 'Création du rôle : ' . $role->nom);
            
            return response()->json([
                'success' => true,
                'data' => $role,
                'message' => 'Rôle créé avec succès'
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création: ' . $e->getMessage()
            ], 500);
        }
    }
    
        // Voir les détails d'un rôle
    public function show($id)
    {
        $role = Role::with(['permissions', 'MonUtilisateurs'])->find($id);
        
        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Rôle non trouvé'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $role
        ]);
    }



 // Modifier un rôle
    public function update(Request $request, $id)
    {
        $role = Role::find($id);
        
        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Rôle non trouvé'
            ], 404);
        }
        
        // Empêcher la modification du rôle Admin
        if ($role->nom === 'Admin' && $id == 1) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de modifier le rôle Admin'
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:50|unique:roles,nom,' . $id,
            'description' => 'nullable|string',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        DB::beginTransaction();
        try {
            $role->update([
                'nom' => $request->nom,
                'description' => $request->description
            ]);
            
            // Synchroniser les permissions
            if ($request->has('permissions')) {
                $role->permissions()->sync($request->permissions);
            }
            
            DB::commit();
            
            $role->load(['permissions', 'MonUtilisateurs']);

            LogHelper::update('roles', $role->id, 'Modification du rôle : ' . $role->nom);
            
            return response()->json([
                'success' => true,
                'data' => $role,
                'message' => 'Rôle mis à jour avec succès'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
            ], 500);
        }
    }


    // Supprimer un rôle
 /*    public function destroy($id)
    {
        $role = Role::find($id);
        
        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Rôle non trouvé'
            ], 404);
        }
        
        // Empêcher la suppression du rôle Admin
        if ($role->nom === 'Admin') {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer le rôle Admin'
            ], 403);
        }
        
        DB::beginTransaction();
        try {
            // Détacher toutes les permissions
            $role->permissions()->detach();
            
            // Détacher tous les utilisateurs
            $role->users()->detach();
            
            // Supprimer le rôle
            $role->delete();
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Rôle supprimé avec succès'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
            ], 500);
        }
    } */



    // Supprimer un rôle
public function destroy($id)
{
    $role = Role::find($id);
    
    if (!$role) {
        return response()->json([
            'success' => false,
            'message' => 'Rôle non trouvé'
        ], 404);
    }
    
    // Empêcher la suppression du rôle Admin
    if ($role->nom === 'Admin') {
        return response()->json([
            'success' => false,
            'message' => 'Impossible de supprimer le rôle Admin'
        ], 403);
    }
    
    DB::beginTransaction();
    try {
        // Détacher toutes les permissions
        $role->permissions()->detach();
        
        // Détacher tous les utilisateurs - CORRIGEZ ICI
        $role->MonUtilisateurs()->detach(); // Changé de users() à MonUtilisateurs()

        $roleName = $role->nom;
        
        // Supprimer le rôle
        $role->delete();
        
        DB::commit();

        LogHelper::delete('roles', $id, 'Suppression du rôle : ' . $roleName);
        
        return response()->json([
            'success' => true,
            'message' => 'Rôle supprimé avec succès'
        ]);
        
    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
        ], 500);
    }
}


      // Assigner des permissions à un rôle
    public function assignPermissions(Request $request, $id)
    {
        $role = Role::find($id);
        
        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Rôle non trouvé'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'permissions' => 'required|array|min:1',
            'permissions.*' => 'exists:permissions,id'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        $role->permissions()->syncWithoutDetaching($request->permissions);
        
        $role->load('permissions');
        
        return response()->json([
            'success' => true,
            'data' => $role,
            'message' => 'Permissions assignées avec succès'
        ]);
    }



   
    
    // Retirer une permission d'un rôle
    public function removePermission($roleId, $permissionId)
    {
        $role = Role::find($roleId);
        
        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Rôle non trouvé'
            ], 404);
        }
        
        $permission = Permission::find($permissionId);
        
        if (!$permission) {
            return response()->json([
                'success' => false,
                'message' => 'Permission non trouvée'
            ], 404);
        }
        
        $role->permissions()->detach($permissionId);
        
        $role->load('permissions');
        
        return response()->json([
            'success' => true,
            'data' => $role,
            'message' => 'Permission retirée avec succès'
        ]);
    }
    
// Dans RoleController.php - ajoutez cette méthode
/* public function showWithDetails($id)
{
    $role = Role::with([
        'permissions:id,code,description',
        'MonUtilisateurs:id,nom,prenom,email,statut'
    ])->find($id);
    
    if (!$role) {
        return response()->json([
            'success' => false,
            'message' => 'Rôle non trouvé'
        ], 404);
    }
    
    // Ajouter les counts
    $role->permissions_count = $role->permissions->count();
    $role->MonUtilisateurs_count = $role->MonUtilisateurs->count();
    
    return response()->json([
        'success' => true,
        'data' => $role
    ]);
} */


// Obtenir les détails complets d'un rôle (méthode améliorée)
public function showWithDetails($id)
{
    $role = Role::with([
        'permissions:id,code,description',
        'MonUtilisateurs:id,nom,prenom,email,statut'
    ])->find($id);
    
    if (!$role) {
        return response()->json([
            'success' => false,
            'message' => 'Rôle non trouvé'
        ], 404);
    }
    
    // Ajouter les counts si nécessaire
    $role->permissions_count = $role->permissions->count();
    $role->MonUtilisateurs_count = $role->MonUtilisateurs->count();
    
    return response()->json([
        'success' => true,
        'data' => $role
    ]);
}

// Supprimez ou commentez la méthode getWithDetails() si elle existe encore
/*
public function getWithDetails($id)
{
    // Cette méthode est redondante avec showWithDetails()
}
*/
        // Obtenir les détails complets d'un rôle
    public function getWithDetails($id)
    {
        $role = Role::with(['permissions', 'MonUtilisateurs'])->find($id);
        
        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Rôle non trouvé'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $role
        ]);
    }


    // Statistiques des rôles
    public function stats()
    {
        $stats = DB::table('roles')
            ->leftJoin('user_role', 'roles.id', '=', 'user_role.role_id')
            ->select('roles.id', 'roles.nom', DB::raw('COUNT(user_role.user_id) as users_count'))
            ->groupBy('roles.id', 'roles.nom')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

}

