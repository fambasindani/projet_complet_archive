<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @deprecated Legacy table `directions` - Utiliser Departement (table `departements`).
 * Direction est conservée pour compatibilité API /direction mais doit être migrée.
 * Idéalement : créer une vue SQL ou alias, et à terme supprimer ce modèle.
 */
class Direction extends Model
{
    use HasFactory;
    protected $table = 'directions';
    protected $fillable = ['nom', 'statut'];
}
