<?php

namespace App\Http\Controllers;

use App\Models\Classeur;
use App\Models\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Helpers\LogHelper;

class ClasseurController extends Controller
{
    
public function getAllclasseur()
{
    return Classeur::where('statut', 1)
                    ->orderBy('id', 'desc')
                    ->get(); // renvoie un tableau brut
}

public function getAll(Request $request)
{
    $perPage = $request->input('per_page', 10);
    return Classeur::
                   orderBy('id', 'desc')
                   ->paginate($perPage);
}


// Rechercher des classeurs par nom avec statut = 1
public function searchClasseur(Request $request)
{
    $query = Classeur::where('statut', 1); // on applique le filtre dès le début

    if ($request->has('search')) {
        $query->where('nom_classeur', 'like', '%' . $request->search . '%');
    }

    $perPage = $request->input('per_page', 10);
    return $query->orderBy('id', 'desc')->paginate($perPage);
}



public function addClasseur(Request $request)
{
    $request->validate([
        'nom_classeur' => 'required|string|max:255|unique:classeurs',
        'statut' => 'nullable|boolean',
    ]);

    $classeur = Classeur::create([
        'nom_classeur' => $request->nom_classeur,
        'statut' => 1,
    ]);

    LogHelper::create('classeurs', $classeur->id, 'Création du classeur : ' . $classeur->nom_classeur);

    return response()->json([
        'message' => 'Classeur ajouté avec succès'
    ], 201);
}

     // Mettre à jour un classeur
public function updateClasseur(Request $request, $id)
{
    $classeur = Classeur::findOrFail($id);

    $request->validate([
        'nom_classeur' => 'required|string|max:255|unique:classeurs,nom_classeur,' . $classeur->id,
        // On ignore 'statut' car il sera forcé à 1
    ]);

    $classeur->nom_classeur = $request->nom_classeur;
    $classeur->statut = "1"; // Statut forcé à 1
    $classeur->save();

    LogHelper::update('classeurs', $classeur->id, 'Modification du classeur : ' . $classeur->nom_classeur);

    return response()->json(['message' => 'Classeur mis à jour avec succès'.$request->nom_classeur]);
}



    // Éditer un classeur existant
    public function editClasseur($id)
    {
        return Classeur::findOrFail($id);
    }

   

public function supprimerClasseur($id)
{
    $classeur = Classeur::findOrFail($id);
    $classeur->delete();

    LogHelper::delete('classeurs', $classeur->id, 'Suppression du classeur : ' . $classeur->nom_classeur);

    return response()->json(['message' => 'Classeur supprimé avec succès']);
}



















}
