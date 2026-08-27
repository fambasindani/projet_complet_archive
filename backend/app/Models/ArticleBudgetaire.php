<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArticleBudgetaire extends Model
{
    use HasFactory;

     protected $fillable = [
        'article_budgetaire',
        'nom',
        'statut', // Assurez-vous d'inclure 'statut' si vous le modifiez via le formulaire
    ];

 // Dans app/Models/NotePerception.php
// Corrigez la relation articleBudgetaire :

public function articleBudgetaire()
{
    return $this->belongsTo(ArticleBudgetaire::class, 'id_article_budgetaire'); // Pas id_ministere !
}


}
