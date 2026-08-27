<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    use HasFactory;

     protected $fillable = [
        'id_utilisateur',
        'id_compagnie',
        // Ajoute ici d'autres champs spécifiques à ton module
    ];

    // 🔗 Relation avec Utilisateur
   public function utilisateur()
{
    return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
}

public function compagnie()
{
    return $this->belongsTo(Compagnie::class, 'id_compagnie');
}


}
