<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Departement extends Model
{
    use HasFactory;

    protected $fillable = ['sigle', 'nom', 'datecreation'];

    protected $casts = [
        'datecreation' => 'datetime'
    ];

     // Relations
    public function monutilisateurs()
    {
        return $this->belongsToMany(Monutilisateur::class, 'direction_user', 'direction_id', 'user_id');
    }

       public function declarations()
    {
        return $this->hasMany(Declaration::class, 'id_direction');
    }
}
