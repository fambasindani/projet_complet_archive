<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Utilisateur;
use App\Models\Compagnie;
use Illuminate\Support\Facades\Hash;

class UtilisateurController extends Controller
{
    // 🔄 Récupération paginée des utilisateurs actifs
    public function getUtilisateurs()
    {
        return Utilisateur::where('statut', 1)->orderBy('id', 'desc')->paginate(10);
    }

    // 🔍 Rechercher un utilisateur par nom ou prénom
    public function searchUtilisateur(Request $request)
    {
        $search = $request->input('search');

        return Utilisateur::where(function($query) use ($search) {
                    $query->where('nom', 'like', "%{$search}%")
                          ->orWhere('prenom', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%");
                })
                ->where('statut', 1)
                ->orderBy('id', 'desc')
                ->paginate(10);
    }

    // ➕ Ajouter un nouvel utilisateur
    public function createUtilisateur(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:utilisateurs',
            'password' => 'required|string|min:8',
            'role' => 'required|string',
            // 'id_direction' => 'integer',
             //'id_note' => 'integer',
            //  'entreprise' => 'integer',

        ]);

        Utilisateur::create([
            'id_direction' => $request->id_direction,
            'id_note' => $request->id_note,
            'entreprise' => $request->entreprise,
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'statut' => 1,
        ]);

        return response()->json(['message' => 'Utilisateur créé avec succès']);
    }

    // 🔍 Récupérer un utilisateur spécifique
    public function editUtilisateur($id)
    {
        return Utilisateur::findOrFail($id);
    }

    // 📝 Mettre à jour un utilisateur
    public function updateUtilisateur(Request $request, $id)
    {
        $utilisateur = Utilisateur::findOrFail($id);

        $request->validate([
           'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
          //  'email' => 'required|email|unique:utilisateurs',
           // 'password' => 'required|string|min:8',
            'role' => 'required|string',
        ]);

        $data = [
            'id_direction' => $request->id_direction,
            'id_note' => $request->id_note,
            'entreprise' => $request->entreprise,
            'nom' => $request->nom,
            'prenom' => $request->prenom,
           // 'email' => $request->email,
           // 'password' => Hash::make($request->password),
            'role' => $request->role,
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $utilisateur->update($data);

        return response()->json(['message' => 'Utilisateur mis à jour avec succès']);
    }

    // ❌ Suppression logique de l'utilisateur
    public function deleteUtilisateur($id)
    {
        $utilisateur = Utilisateur::findOrFail($id);
        $utilisateur->update(['statut' => 0]);

        return response()->json(['message' => 'Utilisateur désactivé avec succès']);
    }





public function login(Request $request)
{
    $validated = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    $utilisateur = Utilisateur::where('email', $validated['email'])->first();

    if (!$utilisateur || !Hash::check($validated['password'], $utilisateur->password)) {
        return response()->json(['message' => 'Identifiants invalides'], 401);
    }

    $token = $utilisateur->createToken('token_utilisateur')->plainTextToken;

    return response()->json([
        'token' => $token,
        'utilisateur' => $utilisateur // 👈 renvoie tous les champs du modèle
    ]);
}













}






