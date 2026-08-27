<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\ArticleBudgetaire;
use App\Helpers\LogHelper;

class ArticleBudgetaireController extends Controller
{
    public function getArticle(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        return ArticleBudgetaire::where('statut', 1)->orderBy('id', 'desc')->paginate($perPage);
    }

    public function getArticleAll()
    {
        return ArticleBudgetaire::where('statut', 1)->orderBy('id', 'desc')->get();
    }

    public function searchArticle(Request $request)
    {
        $search = $request->input('search');
        $perPage = $request->input('per_page', 10);

        return ArticleBudgetaire::where('nom', 'like', "%{$search}%")
                                ->where('statut', 1)
                                ->orderBy('id', 'desc')
                                ->paginate($perPage);
    }

public function creerArticle(Request $request)
{
    $request->validate([
        'article_budgetaire' => 'required|string|max:255|unique:article_budgetaires,article_budgetaire',
        'nom' => 'required|string|max:255|unique:article_budgetaires,nom',

    ]);

    $article = ArticleBudgetaire::create($request->all());

    LogHelper::create('article_budgetaires', $article->id, 'Création de l\'article budgétaire : ' . $article->nom);

    return response()->json(['message' => 'Article budgétaire ajouté avec succès']);
}

    public function editArticle($id)
    {
        return ArticleBudgetaire::findOrFail($id);
    }


public function updateArticle(Request $request, $id)
{
    $article = ArticleBudgetaire::findOrFail($id);

    $request->validate([
        'article_budgetaire' => 'required|string|max:255|unique:article_budgetaires,article_budgetaire,' . $id,
        'nom' => 'required|string|max:255|unique:article_budgetaires,nom,' . $id,
    ]);

    $article->update($request->all());

    LogHelper::update('article_budgetaires', $article->id, 'Modification de l\'article budgétaire : ' . $article->nom);

    return response()->json(['message' => 'Article budgétaire mis à jour avec succès']);
}


    public function deleteArticle($id)
    {
        $article = ArticleBudgetaire::findOrFail($id);
        $article->delete();

        LogHelper::delete('article_budgetaires', $article->id, 'Suppression de l\'article budgétaire : ' . $article->nom);

        return response()->json(['message' => 'Article budgétaire supprimé avec succès']);
    }
}
