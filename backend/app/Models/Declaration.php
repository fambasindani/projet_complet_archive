<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Declaration extends Model
{
    use HasFactory;
       protected $fillable = [
        'id_direction',
        'id_emplacement',
        'id_classeur',
        'id_user',
        'date_creation',
        'date_enregistrement',
        'intitule',
        'num_reference',
        'mot_cle',
        'num_declaration',
        'statut',
    ];

     public function departement()
    {
        return $this->belongsTo(Departement::class, 'id_direction');
    }

    public function emplacement()
    {
        return $this->belongsTo(Emplacement::class, 'id_emplacement');
    }

    public function classeur()
    {
        return $this->belongsTo(Classeur::class, 'id_classeur');
    }

    public function utilisateur()
    {
        return $this->belongsTo(MonUtilisateur::class, 'id_user');
    }

    public function documents()
    {
        return $this->hasMany(DocumentDeclaration::class, 'id_declaration');
    }
}

