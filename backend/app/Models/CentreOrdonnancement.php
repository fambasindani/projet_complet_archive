<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CentreOrdonnancement extends Model
{
    use HasFactory;


    protected $fillable = [
        
        'nom', // Nouveau champ
        'id_ministere',
        'description',
        'statut',
        
    ];

      public function articleBudgetaire()
    {
        return $this->belongsTo(ArticleBudgetaire::class, 'id_ministere');
    }

      public function notes()
    {
        return $this->hasMany(NotePerception::class, 'id_centre_ordonnancement');
    }
}
