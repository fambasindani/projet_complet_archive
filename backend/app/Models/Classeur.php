<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classeur extends Model
{
    use HasFactory;
       // Les champs qui peuvent être assignés en masse
    protected $fillable = [
        'nom_classeur',
        'statut',
    ];

    // Casting des propriétés
    protected $casts = [
        'statut' => 'boolean', // Cast le statut en booléen
    ];

    public function declarations()
{
       return $this->hasMany(Declaration::class, 'id_classeur');
   // return $this->hasMany(Declaration::class); // ou belongsToMany selon votre cas
       // return $this->belongsTo(classeur::class, 'id_classeur');  //id_classeur
}
}
