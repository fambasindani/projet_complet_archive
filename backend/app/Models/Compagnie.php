<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Compagnie extends Model
{
    use HasFactory;
       protected $fillable = ['nom'];



       public function utilisateurs()
{
    return $this->hasMany(Utilisateur::class, 'id_utilisateur');
}

public function modules()
{
    return $this->hasMany(Module::class, 'id_compagnie');
}



}



