<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\DocumentNotePerception;

class DocumentNotePerceptionController extends Controller
{
    // 📄 Récupérer tous les documents liés à une note de perception
    public function getallpdf($id_note_perception)
    {
        return DocumentNotePerception::where('id_note_perception', $id_note_perception)
                                     ->orderBy('id', 'desc')
                                     ->get();
    }

    // 📤 Upload multiple PDF dans dossier organisé par classeur et ministère
    public function uploadMultiple(Request $request)
    {
        $request->validate([
            'files' => 'required|array',
            'files.*' => 'file|mimes:pdf|max:51200',
            'id_note_perception' => 'required|integer',
            'id_classeur' => 'required|integer',
            'id_ministere' => 'required|integer',
        ]);

        $documents = [];

        foreach ($request->file('files') as $file) {
            $nomFichier = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $dossier = "document_noteperception/" . ($request->id_classeur + 100) . "/" . ($request->id_ministere + 100);

            // Stockage dans le dossier spécifique
            $file->storeAs($dossier, $nomFichier);

            $documents[] = DocumentNotePerception::create([
                'id_note_perception' => $request->id_note_perception,
                'id_classeur' => $request->id_classeur,
                'id_ministere' => $request->id_ministere,
                'nom_fichier' => $nomFichier,
                'nom_native' => $file->getClientOriginalName(),
                'taille' => $file->getSize(),
            ]);
        }

        return response()->json([
            'message' => 'Fichiers PDF uploadés avec succès ✅',
            'documents' => $documents
        ], 201);
    }

    // 📥 Télécharger un fichier PDF
    public function download($id)
    {
        $document = DocumentNotePerception::findOrFail($id);

        $idClasseur = $document->id_classeur ?? null;
        $idMinistere = $document->id_ministere ?? null;

        if (!$idClasseur || !$idMinistere) {
            return response()->json(['error' => 'Classeur ou ministère non défini ❌'], 400);
        }

        $dossier = "document_noteperception/" . ($idClasseur + 100) . "/" . ($idMinistere + 100);
        $chemin = storage_path("app/{$dossier}/{$document->nom_fichier}");

        if (!file_exists($chemin)) {
            return response()->json(['error' => 'Fichier introuvable 📁'], 404);
        }

        return response()->file($chemin, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $document->nom_native . '"'
        ]);
    }




public function updateOCRText(Request $request, $id)
{
    $document = DocumentNotePerception::find($id);
    if (!$document) {
        return response()->json(['error' => 'Document non trouvé'], 404);
    }
    $document->montext = $request->input('montext');
    $document->save();
    return response()->json(['success' => true, 'message' => 'Texte OCR enregistré']);
}


public function deleteDocument($id)
{
    $document = DocumentNotePerception::find($id);

    if (!$document) {
        return response()->json(['message' => 'Document non trouvé ❌'], 404);
    }

    $idClasseur = $document->id_classeur ?? null;
    $idMinistere = $document->id_ministere ?? null;

    if (!$idClasseur || !$idMinistere) {
        return response()->json(['error' => 'Classeur ou ministère non défini ❌'], 400);
    }

    $chemin = "document_noteperception/" . ($idClasseur + 100) . "/" . ($idMinistere + 100) . "/" . $document->nom_fichier;

    // Supprimer le fichier physique s’il existe
    if (Storage::exists($chemin)) {
        Storage::delete($chemin);
    }

    // Supprimer l’enregistrement en base
    $document->delete();

    return response()->json(['message' => 'Document supprimé avec succès ✅']);
}










}
