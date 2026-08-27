<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentDeclaration extends Model
{
    use HasFactory;
     protected $fillable = ['id_declaration',   'id_classeur', 'nom_fichier', 'nom_native','taille', 'montext'];


     // app/Models/DocumentDeclaration.php

public function declaration()
{
    return $this->belongsTo(Declaration::class, 'id_declaration');
}

// Pour accéder directement à la direction
public function direction()
{
    return $this->hasOneThrough(
        Departement::class,
        Declaration::class,
        'id', // Clé étrangère sur declarations
        'id', // Clé étrangère sur departements
        'id_declaration', // Clé locale sur document_declarations
        'id_direction' // Clé locale sur declarations
    );
}

// Pour accéder au classeur via la déclaration
public function classeur()
{
    return $this->hasOneThrough(
        Classeur::class,
        Declaration::class,
        'id', // Clé étrangère sur declarations
        'id', // Clé étrangère sur classeurs
        'id_declaration', // Clé locale sur document_declarations
        'id_classeur' // Clé locale sur declarations
    );
}

}
