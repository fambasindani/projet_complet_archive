<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Module;

class ModuleController extends Controller
{
    // 🔄 Récupération des modules avec leurs relations
    public function Getmodule()
    {
        return Module::with(['utilisateur', 'compagnie'])->orderBy('id', 'desc')->paginate(10);
    }

    // 🔍 Recherche par nom/postnom utilisateur et nom compagnie
    public function searchmodule(Request $request)
    {
        $search = $request->input('search');

        return Module::with(['utilisateur', 'compagnie'])
            ->whereHas('utilisateur', function ($query) use ($search) {
                $query->where('nom', 'like', "%{$search}%")
                      ->orWhere('postnom', 'like', "%{$search}%");
            })
            ->orWhereHas('compagnie', function ($query) use ($search) {
                $query->where('nom', 'like', "%{$search}%");
            })
            ->orderBy('id', 'desc')
            ->paginate(10);
    }

    // ➕ Création d’un module
    public function createmodule(Request $request)
    {
        $request->validate([
            'id_utilisateur' => 'required|exists:utilisateurs,id',
            'id_compagnie' => 'required|exists:compagnies,id',
            // Autres validations selon ton schéma
        ]);

        Module::create($request->all());

        return response()->json(['message' => 'Module créé avec succès']);
    }

    // 🔍 Lecture d’un module spécifique
    public function editemodule($id)
    {
        return Module::with(['utilisateur', 'compagnie'])->findOrFail($id);
    }

    // 📝 Mise à jour d’un module
    public function updatemodule(Request $request, $id)
    {
        $module = Module::findOrFail($id);

        $request->validate([
            'id_utilisateur' => 'required|exists:utilisateurs,id',
            'id_compagnie' => 'required|exists:compagnies,id',
            // Autres validations
        ]);

        $module->update($request->all());

        return response()->json(['message' => 'Module mis à jour avec succès']);
    }

    // ❌ Suppression d’un module
    public function destroy($id)
    {
        Module::destroy($id);

        return response()->json(['message' => 'Module supprimé avec succès']);
    }
}
