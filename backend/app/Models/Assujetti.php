<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assujetti extends Model
{
    use HasFactory;

     protected $fillable = [
        'numero_nif',
        'nom_raison_sociale',
        'bp',
        'telephone',
        'email',
        'statut'
    ];
}
