<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotePerception extends Model
{
    protected $fillable = [
        'statut',
        'id_classeur',
        'id_ministere',
        'id_centre_ordonnancement',
        'id_assujetti',
        'numero_article',
        'numero_serie',
        'date_ordonnancement',
        'id_emplacement',
        'date_enregistrement',
        'id_user',
    ];

    public function classeur()
    {
        return $this->belongsTo(Classeur::class, 'id_classeur');
    }

    public function centre()
    {
        return $this->belongsTo(CentreOrdonnancement::class, 'id_centre_ordonnancement');
    }

    public function assujetti()
    {
        return $this->belongsTo(Assujetti::class, 'id_assujetti');
    }

    public function emplacement()
    {
        return $this->belongsTo(Emplacement::class, 'id_emplacement');
    }

    public function utilisateur()
    {
        return $this->belongsTo(MonUtilisateur::class, 'id_user');
    }

      public function articlebudgetaire()
    {
        return $this->belongsTo(ArticleBudgetaire::class, 'id_ministere');
    }

    // app/Models/NotePerception.php

public function documents()
{
    return $this->hasMany(DocumentNotePerception::class, 'id_note_perception', 'id');
}
}
