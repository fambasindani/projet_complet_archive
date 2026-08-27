<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Monutilisateur;
use App\Models\Role;
use App\Models\Departement;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Helpers\LogHelper;

class MonUtilisateurController extends Controller
{




    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Vérifier les credentials
        $user = MonUtilisateur::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email ou mot de passe incorrect'
            ], 401);
        }

        // Vérifier si le compte est actif
        if ($user->statut !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Votre compte est ' . $user->statut . '. Contactez l\'administrateur.'
            ], 403);
        }

        // Charger les relations avec les bons noms de tables
        $user->load([
            'roles' => function($query) {
                $query->select('roles.id', 'roles.nom', 'roles.description', 'roles.created_at', 'roles.updated_at');
            },
            'roles.permissions' => function($query) {
                $query->select('permissions.id', 'permissions.code', 'permissions.description', 'permissions.created_at', 'permissions.updated_at');
            },
            'departements' => function($query) {
                $query->select('departements.id', 'departements.sigle', 'departements.nom', 'departements.datecreation', 'departements.created_at', 'departements.updated_at');
            }
        ]);

        // Récupérer toutes les permissions
        $permissionCodes = [];
        $permissionDetails = [];
        $seenPermissions = [];
        
        foreach ($user->roles as $role) {
            foreach ($role->permissions as $permission) {
                $permissionCodes[] = $permission->code;
                
                if (!in_array($permission->id, $seenPermissions)) {
                    $permissionDetails[] = [
                        'id' => $permission->id,
                        'code' => $permission->code,
                        'description' => $permission->description,
                        'created_at' => $permission->created_at,
                        'updated_at' => $permission->updated_at
                    ];
                    $seenPermissions[] = $permission->id;
                }
            }
        }
        
        $permissionCodes = array_unique($permissionCodes);

        // Créer le token
        $token = $user->createToken('auth_token', $permissionCodes)->plainTextToken;

        // Log de connexion
        \App\Models\Log::create([
            'user_id'     => $user->id,
            'action'      => 'LOGIN',
            'table_name'  => 'monutilisateurs',
            'record_id'   => $user->id,
            'description' => 'Connexion réussie : ' . $user->nom . ' ' . $user->prenom,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Connexion réussie',
            'data' => [
                // 1. Informations de l'utilisateur
                'user' => [
                    'id' => $user->id,
                    'nom' => $user->nom,
                    'prenom' => $user->prenom,
                    'full_name' => $user->full_name, // Accesseur
                    'email' => $user->email,
                    'statut' => $user->statut,
                    'datecreation' => $user->datecreation,
                    'dernierconnection' => $user->dernierconnection,
                    'avatar' => $user->avatar,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ],
                
                // 2. Rôles avec leurs détails et permissions
                'roles' => $user->roles->map(function($role) {
                    return [
                        'id' => $role->id,
                        'nom' => $role->nom,
                        'description' => $role->description,
                        'created_at' => $role->created_at,
                        'updated_at' => $role->updated_at,
                        'permissions' => $role->permissions->map(function($permission) {
                            return [
                                'id' => $permission->id,
                                'code' => $permission->code,
                                'description' => $permission->description,
                                'created_at' => $permission->created_at,
                                'updated_at' => $permission->updated_at
                            ];
                        }),
                        'permissions_count' => $role->permissions->count()
                    ];
                }),
                
                // 3. Permissions (deux formats)
                'permissions' => [
                    'codes' => array_values($permissionCodes),
                    'details' => $permissionDetails
                ],
                
                // 4. Départements
                'departements' => $user->departements->map(function($dept) {
                    return [
                        'id' => $dept->id,
                        'sigle' => $dept->sigle,
                        'nom' => $dept->nom,
                        'datecreation' => $dept->datecreation,
                        'created_at' => $dept->created_at,
                        'updated_at' => $dept->updated_at,
                    ];
                }),
                
                // 5. Token
                'token' => $token,
                'token_type' => 'Bearer',
                
                // 6. Statistiques
                'stats' => [
                    'roles_count' => $user->roles->count(),
                    'permissions_count' => count($permissionCodes),
                    'departements_count' => $user->departements->count()
                ]
            ]
        ]);
    }

    /**
     * Déconnexion
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie'
        ]);
    }

    /**
     * Récupérer l'utilisateur connecté avec toutes ses relations
     */












    // Liste paginée des utilisateurs
    public function index(Request $request)
    {
        $query = Monutilisateur::with(['roles', 'departements']);

        // Recherche - échappement LIKE
        if ($request->filled('search')) {
            $search = addcslashes($request->search, '%_\\');
            $query->where(function($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filtre par statut
        if ($request->filled('statut') && $request->statut !== 'all') {
            $query->where('statut', $request->statut);
        }

        // Pagination sécurisée (max 100)
        $perPage = (int) $request->get('per_page', 15);
        $perPage = max(5, min($perPage, 100));
        $users = $query->orderBy('id', 'desc')->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $users,
            'message' => 'Liste des utilisateurs récupérée avec succès'
        ]);
    }


  public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:50',
            'prenom' => 'required|string|max:50',
            'email' => 'required|email|unique:monutilisateurs',
            'password' => 'required|string|min:6',
            'statut' => 'required|in:active,inactive,bloqué',
            'role_ids' => 'array',
            'role_ids.*' => 'exists:roles,id',
            'direction_ids' => 'array',
            'direction_ids.*' => 'exists:departements,id'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        DB::beginTransaction();
        try {
            $user = Monutilisateur::create([
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'statut' => $request->statut,
                'datecreation' => now()
            ]);
            
            // Assigner les rôles
            if ($request->has('role_ids') && is_array($request->role_ids)) {
                $user->roles()->attach($request->role_ids);
            }
            
            // Assigner les directions
            if ($request->has('direction_ids') && is_array($request->direction_ids)) {
                $user->departements()->attach($request->direction_ids);
            }
            
            DB::commit();
            
            $user->load(['roles', 'departements']);

            LogHelper::create('monutilisateurs', $user->id, 'Création de l\'utilisateur : ' . $user->nom . ' ' . $user->prenom);
            
            return response()->json([
                'success' => true,
                'data' => $user,
                'message' => 'Utilisateur créé avec succès'
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création: ' . $e->getMessage()
            ], 500);
        }
    }


     // Voir les détails d'un utilisateur
    public function show($id)
    {
        $user = Monutilisateur::with(['roles', 'departements'])->find($id);
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }


      // Modifier un utilisateur
    public function update(Request $request, $id)
    {
        $user = Monutilisateur::find($id);
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:50',
            'prenom' => 'required|string|max:50',
            'email' => 'required|email|unique:monutilisateurs,email,' . $id,
            'password' => 'nullable|string|min:6',
            'statut' => 'required|in:active,inactive,bloqué',
            'role_ids' => 'array',
            'role_ids.*' => 'exists:roles,id',
            'direction_ids' => 'array',
            'direction_ids.*' => 'exists:departements,id'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        DB::beginTransaction();
        try {
            $updateData = [
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'email' => $request->email,
                'statut' => $request->statut
            ];
            
            // Mettre à jour le mot de passe si fourni
            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }
            
            $user->update($updateData);
            
            // Synchroniser les rôles
            if ($request->has('role_ids')) {
                $user->roles()->sync($request->role_ids);
            }
            
            // Synchroniser les directions
            if ($request->has('direction_ids')) {
                $user->departements()->sync($request->direction_ids);
            }
            
            DB::commit();
            
            $user->load(['roles', 'departements']);

            LogHelper::update('monutilisateurs', $user->id, 'Modification de l\'utilisateur : ' . $user->nom . ' ' . $user->prenom);
            
            return response()->json([
                'success' => true,
                'data' => $user,
                'message' => 'Utilisateur mis à jour avec succès'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
            ], 500);
        }
    }

     // Supprimer un utilisateur
    public function destroy($id)
    {
        $user = Monutilisateur::find($id);
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }
        
        // Empêcher la suppression de l'utilisateur connecté
        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas supprimer votre propre compte'
            ], 403);
        }
        
        DB::beginTransaction();
        try {
            // Détacher toutes les relations
            $user->roles()->detach();
            $user->departements()->detach();
            
            $userName = $user->nom . ' ' . $user->prenom;
            
            // Supprimer l'utilisateur
            $user->delete();
            
            DB::commit();

            LogHelper::delete('monutilisateurs', $id, 'Suppression de l\'utilisateur : ' . $userName);
            
            return response()->json([
                'success' => true,
                'message' => 'Utilisateur supprimé avec succès'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
            ], 500);
        }
    }
    

 // Assigner des rôles à un utilisateur
    public function assignRoles(Request $request, $id)
    {
        $user = Monutilisateur::find($id);
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'role_ids' => 'required|array|min:1',
            'role_ids.*' => 'exists:roles,id'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        $user->roles()->syncWithoutDetaching($request->role_ids);
        
        $user->load('roles');
        
        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Rôles assignés avec succès'
        ]);
    }


  // Retirer un rôle d'un utilisateur
    public function removeRole($userId, $roleId)
    {
        $user = Monutilisateur::find($userId);
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }
        
        $role = Role::find($roleId);
        
        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Rôle non trouvé'
            ], 404);
        }
        
        // Empêcher de retirer le dernier rôle admin si c'est le seul admin
        if ($role->nom === 'Admin') {
            $adminUsers = MonUtilisateur::whereHas('roles', function($query) {
                $query->where('nom', 'Admin');
            })->count();

            if ($adminUsers <= 1 && $user->hasRole('Admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de retirer le rôle Admin du dernier administrateur'
                ], 403);
            }
        }
        
        $user->roles()->detach($roleId);
        
        $user->load('roles');
        
        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Rôle retiré avec succès'
        ]);
    }




       // Assigner des directions à un utilisateur
    public function assignDirections(Request $request, $id)
    {
        $user = Monutilisateur::find($id);
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'direction_ids' => 'required|array|min:1',
            'direction_ids.*' => 'exists:departements,id'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        $user->departements()->syncWithoutDetaching($request->direction_ids);
        
        $user->load('departements');
        
        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Directions assignées avec succès'
        ]);
    }


    // Retirer une direction d'un utilisateur
    public function removeDirection($userId, $directionId)
    {
        $user = Monutilisateur::find($userId);
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }
        
        $direction = Departement::find($directionId);
        
        if (!$direction) {
            return response()->json([
                'success' => false,
                'message' => 'Direction non trouvée'
            ], 404);
        }
        
        $user->departements()->detach($directionId);
        
        $user->load('departements');
        
        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Direction retirée avec succès'
        ]);
    }







     // Obtenir les détails complets d'un utilisateur
    public function getWithDetails($id)
    {
        $user = Monutilisateur::with(['roles.permissions', 'departements'])->find($id);
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }











   public function stats()
    {
        $total = Monutilisateur::count();
        $active = Monutilisateur::where('statut', 'active')->count();
        $inactive = Monutilisateur::where('statut', 'inactive')->count();
        $blocked = Monutilisateur::where('statut', 'bloqué')->count();
        
        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'active' => $active,
                'inactive' => $inactive,
                'blocked' => $blocked
            ]
        ]);

    }

          // Statistiques du dashboard
    public function dashboardStats()
    {
        $userStats = $this->stats()->getData()->data;
        
        $roleStats = DB::table('roles')
            ->leftJoin('user_role', 'roles.id', '=', 'user_role.role_id')
            ->select('roles.id', 'roles.nom', DB::raw('COUNT(user_role.user_id) as users_count'))
            ->groupBy('roles.id', 'roles.nom')
            ->get();
        
        $directionStats = DB::table('departements')
            ->leftJoin('direction_user', 'departements.id', '=', 'direction_user.direction_id')
            ->select('departements.id', 'departements.sigle', DB::raw('COUNT(direction_user.user_id) as users_count'))
            ->groupBy('departements.id', 'departements.sigle')
            ->get();
        
        $recentUsers = Monutilisateur::with(['roles', 'departements'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => [
                'users' => $userStats,
                'roles' => $roleStats,
                'directions' => $directionStats,
                'recent_users' => $recentUsers,
                'total_roles' => Role::count(),
                'total_directions' => Departement::count(),
                'directions_with_users' => $directionStats->where('users_count', '>', 0)->count()
            ]
        ]);
    }




       
    // Utilisateurs récents
    public function recentUsers()
    {
        $users = Monutilisateur::with(['roles', 'departements'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }


    }