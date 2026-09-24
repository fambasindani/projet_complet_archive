<?php




namespace App\Http\Controllers;
use App\Models\Declaration;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Models\DocumentDeclaration;

class DeclarationController extends Controller
{

public function editdeclaration($id)
    {
        return Declaration::with(['departement', 'emplacement', 'classeur', 'utilisateur'])->findOrFail($id);
    }


public function getlistedocument(Request $request, $id)
{
    // Récupérer les IDs des directions depuis la requête
    $directionIds = $request->input('direction_ids');
    
    $query = Declaration::with(['departement', 'emplacement', 'classeur'])
        ->where('statut', 1)
        ->where('id_classeur', $id);
    
    // Si des directions sont spécifiées, filtrer par ces directions
    if ($directionIds) {
        $ids = explode(',', $directionIds);
        $query->whereIn('id_direction', $ids);
    }
    
    $declarations = $query->orderBy('id', 'desc')->paginate(20);

    $declarations->getCollection()->transform(function ($item) {
        $item->nom_direction = $item->departement->nom ?? null;
        $item->nom_emplacement = $item->emplacement->nom_emplacement ?? null;
        return $item;
    });

    return response()->json($declarations);
}




    

public function searchDeclarationsfiltrexxx(Request $request, $id)
{
    $search = $request->input('search');
    $page = $request->input('page', 1);
    
    // 🔥 Récupérer les IDs des directions depuis la requête
    $directionIds = $request->input('direction_ids');
    
    \Log::info('=== searchDeclarationsfiltre appelé ===');
    \Log::info('ID Classeur: ' . $id);
    \Log::info('Search: ' . $search);
    \Log::info('Direction IDs reçus: ' . ($directionIds ?? 'aucun'));

    $query = Declaration::with(['departement', 'emplacement', 'classeur'])
        ->where('statut', 1)
        ->where('id_classeur', $id)
        ->where(function ($q) use ($search) {
            $q->where('intitule', 'like', "%$search%")
              ->orWhere('num_reference', 'like', "%$search%")
              ->orWhere('mot_cle', 'like', "%$search%")
              ->orWhere('num_declaration', 'like', "%$search%");
        });
    
    // 🔥 APPLIQUER LE FILTRE PAR DIRECTIONS
    if ($directionIds && !empty($directionIds)) {
        if (is_string($directionIds)) {
            $directionIds = explode(',', $directionIds);
        }
        $directionIds = array_map('intval', $directionIds);
        $query->whereIn('id_direction', $directionIds);
        
        \Log::info('Filtrage par directions: ' . implode(', ', $directionIds));
    } else {
        // 🔥 Si aucun direction_ids, ne rien retourner (utilisateur sans direction)
        \Log::info('Aucune direction - retour tableau vide');
        return response()->json([
            'data' => [],
            'current_page' => 1,
            'last_page' => 1,
            'total' => 0,
            'per_page' => 20
        ]);
    }

    $declarations = $query->orderBy('id', 'desc')->paginate(20, ['*'], 'page', $page);

    $declarations->getCollection()->transform(function ($item) {
        $item->nom_direction = $item->departement->nom ?? null;
        $item->nom_emplacement = $item->emplacement->nom_emplacement ?? null;
        unset($item->departement);
        unset($item->emplacement);
        return $item;
    });

    \Log::info('Nombre de documents retournés: ' . $declarations->total());

    return response()->json($declarations);
}


public function searchDeclarationsfiltre(Request $request)
{
    $search = $request->input('search');
    $page = $request->input('page', 1);
    
    // 🔥 Récupérer les IDs des directions depuis la requête
    $directionIds = $request->input('direction_ids');
    
    \Log::info('=== searchDeclarations (globale) appelé ===');
    \Log::info('Search: ' . $search);
    \Log::info('Direction IDs reçus: ' . ($directionIds ?? 'aucun'));

    // 🔥 Vérifier si des direction_ids sont fournis
    if (!$directionIds || empty($directionIds)) {
        \Log::info('Aucune direction - retour tableau vide');
        return response()->json([
            'success' => true,
            'data' => [
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'total' => 0,
                'per_page' => 20
            ],
            'filtered_by' => 'none'
        ]);
    }

    // Convertir les IDs en tableau d'entiers
    if (is_string($directionIds)) {
        $directionIds = explode(',', $directionIds);
    }
    $directionIds = array_map('intval', $directionIds);
    
    // Filtrer les IDs invalides
    $directionIds = array_filter($directionIds, function($id) {
        return $id > 0;
    });

    if (empty($directionIds)) {
        \Log::info('Aucun ID valide - retour tableau vide');
        return response()->json([
            'success' => true,
            'data' => [
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'total' => 0,
                'per_page' => 20
            ],
            'filtered_by' => 'none'
        ]);
    }

    \Log::info('IDs après conversion: ' . implode(', ', $directionIds));

    // 🔥 REQUÊTE SANS where('id_classeur', $id)
    $query = Declaration::with(['departement', 'emplacement', 'classeur'])
        ->where('statut', 1)
        ->whereIn('id_direction', $directionIds)
        ->where(function ($q) use ($search) {
            $q->where('intitule', 'like', "%$search%")
              ->orWhere('num_reference', 'like', "%$search%")
              ->orWhere('mot_cle', 'like', "%$search%")
              ->orWhere('num_declaration', 'like', "%$search%");
        });

    \Log::info('Filtrage par directions: ' . implode(', ', $directionIds));

    // Paginer les résultats
    $declarations = $query->orderBy('id', 'desc')->paginate(20, ['*'], 'page', $page);

    // Transformer les données
    $declarations->getCollection()->transform(function ($item) {
        $item->nom_direction = $item->departement->nom ?? null;
        $item->nom_emplacement = $item->emplacement->nom_emplacement ?? null;
        unset($item->departement);
        unset($item->emplacement);
        return $item;
    });

    \Log::info('Nombre de documents retournés: ' . $declarations->total());

    return response()->json([
        'success' => true,
        'data' => $declarations,
        'filtered_by' => $directionIds
    ]);
}




public function listedocumentdirectionall(Request $request, $id)
{
    //$id = $request->input('id_classeur');
    $id_direction = $request->input('id_direction');

    $declarations = Declaration::with(['departement', 'emplacement', 'classeur'])
        ->where('statut', 1)
        ->where('id_classeur', $id)
        ->where('id_direction', $id_direction)
        ->orderBy('id', 'desc')
        ->paginate(20);

    $declarations->getCollection()->transform(function ($item) {
        $item->nom_direction = $item->direction->nom ?? null;
        $item->nom_emplacement = $item->emplacement->nom_emplacement ?? null;
        return $item;
    });

    return response()->json($declarations);
}







public function getDeclarationsttt()
{
    $declarations = Declaration::with(['departement', 'emplacement', 'classeur'])
        ->where('statut', 1)
        ->orderBy('id', 'desc')
        ->paginate(20);

    $declarations->getCollection()->transform(function ($item) {
        $item->nom_direction = $item->departement->nom ?? null;
        $item->nom_emplacement = $item->emplacement->nom_emplacement?? null;
        return $item;
    });

    return response()->json($declarations);
}


public function getDeclarations(Request $request)
{
    $directionIds = $request->input('direction_ids');

    $query = Declaration::with(['departement', 'emplacement', 'classeur'])
        ->where('statut', 1)
        ->orderBy('id', 'desc');

    if ($directionIds && !empty($directionIds)) {
        if (is_string($directionIds)) {
            $directionIds = explode(',', $directionIds);
        }
        $directionIds = array_map('intval', $directionIds);
        $directionIds = array_filter($directionIds, fn($v) => $v > 0);
        if (!empty($directionIds)) {
            $query->whereIn('id_direction', $directionIds);
        }
    }

    $perPage = max(5, min((int)$request->input('per_page', 20), 100));
    $declarations = $query->orderBy('id', 'desc')->paginate($perPage);
    
    $declarations->getCollection()->transform(function ($item) {
        $item->nom_direction = $item->departement->nom ?? null;
        $item->nom_emplacement = $item->emplacement->nom_emplacement ?? null;
        unset($item->departement);
        unset($item->emplacement);
        return $item;
    });

    return response()->json([
        'success' => true,
        'data' => $declarations,
        'filtered_by' => $directionIds ?? 'all'
    ]);
}



public function searchDeclarations(Request $request)
{
    $search = $request->input('search', '');
    $escaped = addcslashes($search, '%_\\');
    $page = max(1, (int)$request->input('page', 1));

    $query = Declaration::with(['departement', 'emplacement','classeur'])
        ->where('statut', 1)
        ->where(function ($q) use ($escaped) {
            $q->where('intitule', 'like', "%{$escaped}%")
              ->orWhere('num_reference', 'like', "%{$escaped}%")
              ->orWhere('mot_cle', 'like', "%{$escaped}%")
              ->orWhere('num_declaration', 'like', "%{$escaped}%");
        });

    $declarations = $query->orderBy('id', 'desc')->paginate(20, ['*'], 'page', $page);

    $declarations->getCollection()->transform(function ($item) {
        $item->nom_direction = $item->departement->nom ?? null;
        $item->nom_emplacement = $item->emplacement->nom_emplacement ?? null;
        return $item;
    });

    return response()->json($declarations);
}


    // ➕ Création
    // public function createdeclaration(Request $request)
    // {
    //     $validated = $request->validate([
    //         'id_direction' => 'required|integer',
    //         'id_emplacement' => 'required|integer',
    //         'id_classeur' => 'required|integer',
    //         'id_user' => 'required|integer',
    //         'date_creation' => 'required|date',
    //         'date_enregistrement' => 'required|date',
    //         'intitule' => 'required|string|max:255',
    //         'num_reference' => 'required|string|max:255',
    //         'mot_cle' => 'required|string|max:255',
    //         'num_declaration' => 'required|string|max:255',
    //     ]);

    //     $validated['statut'] = 1;

    //     $declaration = Declaration::create($validated);

    //     return response()->json($declaration, 201);
    // }




public function createdeclarations(Request $request)
{
    // 1️⃣ Validation de la déclaration
    $validatedDeclaration = $request->validate([
        'id_direction' => 'required|integer',
        'id_emplacement' => 'required|integer',
        'id_classeur' => 'required|integer',
        'id_user' => 'required|integer',
        'date_creation' => 'required|date',
        'date_enregistrement' => 'required|date',
        'intitule' => 'required|string|max:255',
        'num_reference' => 'required|string|max:255',
        'mot_cle' => 'required|string|max:255',
        'num_declaration' => 'required|string|max:255',
    ]);

    $validatedDeclaration['statut'] = 1;

    // 2️⃣ Démarrage de la transaction
    DB::beginTransaction();

    try {
        // Création de la déclaration
        $declaration = Declaration::create($validatedDeclaration);

        $documents = [];

        if ($request->hasFile('files')) {
            // Validation des fichiers
            $request->validate([
                'files' => 'required|array',
                'files.*' => 'file|mimes:pdf|max:51200', // max 50 Mo
            ]);

            foreach ($request->file('files') as $file) {
                $ext = strtolower($file->getClientOriginalExtension() ?: 'pdf');
                if ($ext === '') $ext = 'pdf';
                $nomFichier = Str::uuid() . '.' . $ext;
                $dossier = "document_declaration/" . ($request->id_classeur + 100);

                // Stockage du fichier
                $file->storeAs($dossier, $nomFichier);

                // Création du document lié à la déclaration
                $documents[] = DocumentDeclaration::create([
                    'id_declaration' => $declaration->id,
                    'id_classeur' => $request->id_classeur,
                    'nom_fichier' => $nomFichier,
                    'nom_native' => $file->getClientOriginalName(),
                ]);
            }
        }

        // ✅ Tout est bon, commit de la transaction
        DB::commit();

        return response()->json([
            'declaration' => $declaration,
            'documents' => $documents,
            'message' => 'Déclaration créée et fichiers uploadés avec succès ✅'
        ], 201);

    } catch (\Exception $e) {
        // ❌ Une erreur est survenue, rollback
        DB::rollBack();

        return response()->json([
            'message' => 'Erreur lors de la création de la déclaration ou de l’upload des fichiers',
            'error' => $e->getMessage()
        ], 500);
    }
}


public function createdeclaration(Request $request)
{
    // 1️⃣ Validation de la déclaration seulement (sans les fichiers) - id_user forcé depuis token
    $validatedDeclaration = $request->validate([
        'id_direction' => 'required|integer|exists:departements,id',
        'id_emplacement' => 'required|integer|exists:emplacements,id',
        'id_classeur' => 'required|integer|exists:classeurs,id',
        'date_creation' => 'required|date',
        'date_enregistrement' => 'required|date',
        'intitule' => 'required|string|max:255',
        'num_reference' => 'required|string|max:255',
        'mot_cle' => 'required|string|max:255',
        'num_declaration' => 'required|string|max:255',
    ]);

    $validatedDeclaration['statut'] = 1;
    $validatedDeclaration['id_user'] = $request->user()->id;

    try {
        // Création de la déclaration seulement
        $declaration = Declaration::create($validatedDeclaration);

        return response()->json([
            'success' => true,
            'id' => $declaration->id,
            'declaration' => $declaration,
            'message' => 'Déclaration créée avec succès ✅'
        ], 201);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la création de la déclaration',
            'error' => $e->getMessage()
        ], 500);
    }
}




    // ✏️ Mise à jour - sécurisé (id_user non modifiable)
    public function updatedeclaration(Request $request, $id)
    {
        $declaration = Declaration::findOrFail($id);

        $validated = $request->validate([
            'id_direction' => 'required|integer|exists:departements,id',
            'id_emplacement' => 'required|integer|exists:emplacements,id',
            'id_classeur' => 'required|integer|exists:classeurs,id',
            'date_creation' => 'required|date',
            'date_enregistrement' => 'required|date',
            'intitule' => 'required|string|max:255',
            'num_reference' => 'required|string|max:255',
            'mot_cle' => 'required|string|max:255',
            'num_declaration' => 'required|string|max:255',
        ]);

        $declaration->update($validated);

        return response()->json($declaration);
    }

   public function destroy($id)
{
    $declaration = Declaration::findOrFail($id);
    $declaration->update(['statut' => 0]);

    return response()->json(['message' => 'Déclaration désactivée avec succès']);
}

}
