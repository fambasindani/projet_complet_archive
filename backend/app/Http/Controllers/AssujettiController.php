<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Assujetti;

class AssujettiController extends Controller
{
    
    public function getassujetti()
    {
        return Assujetti::where('statut', 1)->orderBy('id', 'desc')->paginate(10);
    }

    public function searchassujetti(Request $request)
    {
        $search = $request->input('search');

        return Assujetti::where('nom_raison_sociale', 'like', "%{$search}%")
                        ->where('statut', 1)
                        ->orderBy('id', 'desc')
                        ->paginate(10);
    }

    public function  createassujetti(Request $request)
    {
        $request->validate([
        'nom_raison_sociale' => 'required|string|max:255',
        'telephone' => 'required|string|max:50',
        'bp' => 'nullable|string|max:50',
        'numero_nif' => 'nullable|string|max:50',
        'email' => 'nullable|email|string|max:50',
]);


        Assujetti::create($request->all());

        return response()->json(['message' => 'Assujetti ajouté avec succès']);
    }

    public function editassujetti($id)
    {
        return Assujetti::findOrFail($id);
    }

    public function updateassujetti(Request $request, $id)
    {
        $assujetti = Assujetti::findOrFail($id);

        $request->validate([
            'nom_raison_sociale' => 'required|string|max:255',
            'telephone' => 'required|string|max:50',
            'bp' => 'string|max:50',
            'numero_nif' => 'string|max:50',
            'email' => 'email|string|max:50',

        ]);

        $assujetti->update($request->all());

        return response()->json(['message' => 'Assujetti mis à jour avec succès']);
    }

    public function supprimerassujetti($id)
    {
        $assujetti = Assujetti::findOrFail($id);
        $assujetti->update(['statut' => 0]);

        return response()->json(['message' => 'Assujetti désactivé']);
    }























}
