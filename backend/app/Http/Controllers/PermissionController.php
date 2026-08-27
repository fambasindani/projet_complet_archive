<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Support\Facades\Validator;
use App\Helpers\LogHelper;

class PermissionController extends Controller
{
    


    // Liste des permissions
    public function index(Request $request)
    {
        $query = Permission::withCount('roles');
        
        // Recherche
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }
        
        $perPage = $request->get('per_page', 10);
        $permissions = $query->orderBy('id', 'desc')->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $permissions,
            'message' => 'Liste des permissions récupérée avec succès'
        ]);
    }
    
    // Créer une permission
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:50|unique:permissions',
            'description' => 'nullable|string'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        $permission = Permission::create([
            'code' => $request->code,
            'description' => $request->description
        ]);

        LogHelper::create('permissions', $permission->id, 'Création de la permission : ' . $permission->code);
        
        return response()->json([
            'success' => true,
            'data' => $permission,
            'message' => 'Permission créée avec succès'
        ], 201);
    }
    
    // Voir les détails d'une permission
    public function show($id)
    {
        $permission = Permission::with('roles')->find($id);
        
        if (!$permission) {
            return response()->json([
                'success' => false,
                'message' => 'Permission non trouvée'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $permission
        ]);
    }
    
    // Modifier une permission
    public function update(Request $request, $id)
    {
        $permission = Permission::find($id);
        
        if (!$permission) {
            return response()->json([
                'success' => false,
                'message' => 'Permission non trouvée'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:50|unique:permissions,code,' . $id,
            'description' => 'nullable|string'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        $permission->update([
            'code' => $request->code,
            'description' => $request->description
        ]);
        
        $permission->load('roles');

        LogHelper::update('permissions', $permission->id, 'Modification de la permission : ' . $permission->code);
        
        return response()->json([
            'success' => true,
            'data' => $permission,
            'message' => 'Permission mise à jour avec succès'
        ]);
    }
    
    // Supprimer une permission
    public function destroy($id)
    {
        $permission = Permission::find($id);
        
        if (!$permission) {
            return response()->json([
                'success' => false,
                'message' => 'Permission non trouvée'
            ], 404);
        }
        
        // Vérifier si la permission est utilisée par des rôles
        if ($permission->roles()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer cette permission car elle est utilisée par des rôles'
            ], 403);
        }
        
        $permission->delete();

        LogHelper::delete('permissions', $permission->id, 'Suppression de la permission : ' . $permission->code);
        
        return response()->json([
            'success' => true,
            'message' => 'Permission supprimée avec succès'
        ]);
    }
    
    // Obtenir les rôles utilisant cette permission
    public function getUsedByRoles($id)
    {
        $permission = Permission::with('roles')->find($id);
        
        if (!$permission) {
            return response()->json([
                'success' => false,
                'message' => 'Permission non trouvée'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'permission' => $permission,
                'roles' => $permission->roles
            ]
        ]);
    }


}
