<?php

namespace App\Models;

/**
 * @deprecated Legacy table `utilisateurs` - Utiliser MonUtilisateur.
 * Conservé pour compatibilité historique, ne plus utiliser pour nouveau code.
 */
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Utilisateur extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'utilisateurs';

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'password',
        'role',
        'statut',
        'id_direction',
        'id_note',
        'entreprise'
    ];

    protected $hidden = [
        'password',
    ];

    public function compagnie()
    {
        return $this->belongsTo(Departement::class, 'id_direction');
    }

    public function modules()
    {
        return $this->belongsTo(CentreOrdonnancement::class, 'id_centre');
    }
}
