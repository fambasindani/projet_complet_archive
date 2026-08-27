<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentNotePerception extends Model
{
    use HasFactory;
        protected $fillable = ['id_note_perception', 'nom_fichier', 'nom_native', 'id_classeur', 'id_ministere', 'taille', 'montext'];


}
