<?php








namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\MonUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class MonUserController extends Controller
{
    // ✅ Lister tous les utilisateurs
    public function index()
    {
        return MonUser::with(['roles','droits','groupes'])->get();
    }

    // ✅ Créer un utilisateur
    public function store(Request $request)
      {
    try {

        // ✅ Validation
        $request->validate([
            'nom' => 'required',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
        ]);

        // ✅ Création utilisateur
        $user = MonUser::create([
            'nom' => $request->nom,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // ✅ Succès
        return response()->json([
            'status' => true,
            'message' => 'Utilisateur créé avec succès',
            'data' => $user
        ], 201);

    } catch (\Illuminate\Validation\ValidationException $e) {

        // ❌ Erreurs de validation
        return response()->json([
            'status' => false,
            'message' => 'Erreur de validation',
            'errors' => $e->errors()
        ], 422);

    } catch (\Exception $e) {

        // ❌ Autres erreurs
        return response()->json([
            'status' => false,
            'message' => 'Erreur serveur',
            'error' => $e->getMessage()
        ], 500);
    }
}


    // ✅ Afficher un utilisateur
    public function show($id)
    {
        return User::with(['roles','droits','groupes'])->findOrFail($id);
    }

    // ✅ Modifier un utilisateur
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $user->update($request->only('nom','email'));

        if ($request->password) {
            $user->update(['password'=>Hash::make($request->password)]);
        }

        return response()->json($user);
    }

    // ✅ Supprimer un utilisateur
    public function destroy($id)
    {
        User::findOrFail($id)->delete();
        return response()->json(['message'=>'Utilisateur supprimé']);
    }

    // ✅ Assigner rôles
    public function assignRoles(Request $request, $id)
    {
        $request->validate(['roles'=>'required|array']);

        $user = User::findOrFail($id);
        $user->roles()->sync($request->roles);

        return response()->json([
            'message'=>'Rôles assignés',
            'roles'=>$user->roles
        ]);
    }

    // ✅ Assigner droits
    public function assignDroits(Request $request, $id)
    {
        $request->validate(['droits'=>'required|array']);

        $user = User::findOrFail($id);
        $user->droits()->sync($request->droits);

        return response()->json([
            'message'=>'Droits assignés',
            'droits'=>$user->droits
        ]);
    }

    // ✅ Assigner groupes
    public function assignGroupes(Request $request, $id)
    {
        $request->validate(['groupes'=>'required|array']);

        $user = User::findOrFail($id);
        $user->groupes()->sync($request->groupes);

        return response()->json([
            'message'=>'Groupes assignés',
            'groupes'=>$user->groupes
        ]);
    }

    // ✅ Droits finaux calculés
    public function droitsFinaux($id)
    {
        $user = User::with(['roles.droits','groupes.droits','droits'])->findOrFail($id);

        return response()->json([
            'user'=>$user->nom,
            'droits_finaux'=>$user->droitsFinaux()->pluck('code')
        ]);
    }
}
