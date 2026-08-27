<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Direction;
use App\Helpers\LogHelper;



class DirectionController extends Controller
{

public function getAlldirection()
{
    return Direction::where('statut', 1)
                   ->orderBy('id', 'desc')
                    ->get(); // renvoie un tableau brut
}



   public function Getdirection(Request $request)
{
    $perPage = $request->input('per_page', 10);
    return Direction::
                    orderBy('id', 'desc')
                    ->paginate($perPage);
}


    // 🔍 Rechercher une direction par nom
    public function searchdirection(Request $request)
    {
        $search = $request->input('search');
        $perPage = $request->input('per_page', 10);

        return Direction::where('nom', 'like', "%{$search}%")
                        ->where('statut', 1)
                        ->orderBy('id', 'desc')
                        ->paginate($perPage);
    }

    // ➕ Ajouter une nouvelle direction
    public function createdirection(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:255|unique:directions',
        ]);

        $direction = Direction::create([
            'nom' => $request->nom,
            'statut' => 1,
        ]);

        LogHelper::create('directions', $direction->id, 'Création de la direction : ' . $direction->nom);

        return response()->json(['message' => 'Direction créée avec succès']);
    }

    // 🔍 Récupérer une direction spécifique
    public function editdirection($id)
    {
        return Direction::findOrFail($id);
    }

    // 📝 Mettre à jour une direction
    public function updatedirection(Request $request, $id)
    {
        $direction = Direction::findOrFail($id);

        $request->validate([
            'nom' => 'required|string|max:255|unique:directions,nom,' . $direction->id,
        ]);

        $direction->update(['nom' => $request->nom]);

        LogHelper::update('directions', $direction->id, 'Modification de la direction : ' . $direction->nom);

        return response()->json(['message' => 'Direction mise à jour avec succès']);
    }

    // ❌ Suppression logique de la direction
    public function deletedirection($id)
    {
        $direction = Direction::findOrFail($id);
        $direction->update(['statut' => 0]);

        LogHelper::delete('directions', $direction->id, 'Suppression de la direction : ' . $direction->nom);

        return response()->json(['message' => 'Direction désactivée avec succès']);
    }


    






































}
