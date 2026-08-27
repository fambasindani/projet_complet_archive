<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CentreOrdonnancement;
use Carbon\Carbon;
use App\Helpers\LogHelper;


class CentreOrdonnancementController extends Controller
{

public function getAll(Request $request)
{
    $perPage = $request->input('per_page', 10);
    return CentreOrdonnancement::with('articleBudgetaire')
                                 -> where('statut', 1)
                                ->orderBy('id', 'desc')
                                ->paginate($perPage);
}


public function getcentre()
{
    // Récupérer tous les enregistrements où statut = 1
    // Les plus récents (insertions) apparaissent en premier grâce au tri par ID décroissant
    return CentreOrdonnancement:: where('statut', 1)
                                ->orderBy('id', 'desc') // tri décroissant
                                ->paginate(10);
}


public function searchcentre(Request $request)
{
    // Recherche avec statut = 1
    $query = CentreOrdonnancement::with('articleBudgetaire')
    ->where('statut', 1);

    if ($request->has('search')) {
        $query->where('nom', 'like', '%' . $request->search . '%');
    }

    $perPage = $request->input('per_page', 10);
    return $query->orderBy('id', 'desc')->paginate($perPage);
}



public function addcentre(Request $request)
{
    $request->validate([
        'nom' => 'required|string|max:255|unique:centre_ordonnancements', // Validation unique
        'description' => 'nullable|string|max:255',
        'id_ministere' => 'required|integer', // Validation requise
    ], [
        'id_ministere.required' => 'Veuillez sélectionner le champ nom du ministère.',
        'id_ministere.integer' => 'Veuillez sélectionner le champ nom du ministère.',
    ]);

    // Créer un nouvel enregistrement dans la table
    $centre = CentreOrdonnancement::create([
        'nom' => $request->nom,
        'description' => $request->description,
        'statut' => "1",
        'id_ministere' => $request->id_ministere, // Ajout du champ id_ministere
    ]);

    LogHelper::create('centre_ordonnancements', $centre->id, 'Création du centre ordonnancement : ' . $centre->nom);

    return response()->json(['message' => 'Centre ordonnancement ajouté avec succès']);
}






public function updateCentre(Request $request, $id)
{
    // 🧩 Récupération du centre
    $centre = CentreOrdonnancement::findOrFail($id);

    // ✅ Validation des données
    $request->validate([
        'nom' => 'required|string|max:255', // Validation unique
        'description' => 'nullable|string|max:255',
        'id_ministere' => 'required|integer', // Validation requise
    ], [
        'id_ministere.required' => 'Veuillez sélectionner le champ nom du ministère.',
        'id_ministere.integer' => 'Veuillez sélectionner le champ nom du ministère.',
    ]);

    // 🛠 Mise à jour des champs spécifiques
    $centre->nom = $request->nom;
    $centre->description = $request->description;
    $centre->id_ministere = $request->id_ministere;
    $centre->save();

    LogHelper::update('centre_ordonnancements', $centre->id, 'Modification du centre ordonnancement : ' . $centre->nom);

    // 📦 Réponse JSON
     return response()->json(['message' => 'Centre ordonnancement mis à jour avec succès']);
}


    public function editcentre($id)
    {
        return CentreOrdonnancement::findOrFail($id);
    }

    

   public function supprimercentre($id)
    {
        $centreOrdonnancement = CentreOrdonnancement::findOrFail($id);
        $centreOrdonnancement->delete();

        LogHelper::delete('centre_ordonnancements', $centreOrdonnancement->id, 'Suppression du centre ordonnancement : ' . $centreOrdonnancement->nom);

        return response()->json(['message' => 'Centre supprimé avec succès']);
    }





















    
}
