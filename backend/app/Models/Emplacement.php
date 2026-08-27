<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Emplacement extends Model
{
    use HasFactory;

        // Les champs qui peuvent être assignés en masse
    protected $fillable = [
        'nom_emplacement',
        'statut',
    ];

    // Casting des propriétés
    protected $casts = [
        'statut' => 'boolean', // Cast le statut en booléen
    ];
}
