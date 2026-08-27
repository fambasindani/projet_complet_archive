<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Emplacement;
use App\Helpers\LogHelper;


class EmplacementController extends Controller
{
    


public function getAllemplacement()
{
    return Emplacement::where('statut', 1)
                    ->orderBy('id', 'desc')
                    ->get(); // renvoie un tableau brut
}


   public function getAll(Request $request)
{
    $perPage = $request->input('per_page', 10);
    return Emplacement::where('statut', 1)
                      ->orderBy('id', 'desc')
                      ->paginate($perPage);
}

public function searchEmplacement(Request $request)
{
    $query = Emplacement::where('statut', 1);

    if ($request->has('search')) {
        $query->where('nom_emplacement', 'like', '%' . $request->search . '%');
    }

    $perPage = $request->input('per_page', 10);
    return $query->orderBy('id', 'desc')
                 ->paginate($perPage);
}


    public function addEmplacement(Request $request)
    {
        $request->validate([
            'nom_emplacement' => 'required|string|max:255|unique:emplacements',
        ]);

        $emplacement = Emplacement::create([
            'nom_emplacement' => $request->nom_emplacement,
            'statut' => 1,
        ]);

        LogHelper::create('emplacements', $emplacement->id, 'Création de l\'emplacement : ' . $emplacement->nom_emplacement);

        return response()->json(['message' => 'Emplacement ajouté avec succès'], 201);
    }

    public function editEmplacement($id)
    {
        return Emplacement::findOrFail($id);
    }

    public function updateEmplacement(Request $request, $id)
    {
        $emplacement = Emplacement::findOrFail($id);

        $request->validate([
            'nom_emplacement' => 'required|string|max:255|unique:emplacements,nom_emplacement,' . $emplacement->id,
        ]);

        $emplacement->update($request->all());

        LogHelper::update('emplacements', $emplacement->id, 'Modification de l\'emplacement : ' . $emplacement->nom_emplacement);

        return response()->json(['message' => 'Emplacement mis à jour avec succès']);
    }

    public function supprimerEmplacement($id)
    {
        $emplacement = Emplacement::findOrFail($id);
        $emplacement->delete();

        LogHelper::delete('emplacements', $emplacement->id, 'Suppression de l\'emplacement : ' . $emplacement->nom_emplacement);

        return response()->json(['message' => 'Emplacement supprimé avec succès']);
    }


























}
