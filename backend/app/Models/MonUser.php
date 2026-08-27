<?php

namespace App\Models;

/**
 * @deprecated Legacy - Table `users` via MonUser (Droit/Groupe inexistants).
 * Utiliser MonUtilisateur + Role/Permission. Conservé pour compatibilité read-only.
 */
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MonUser extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'users';

    protected $fillable = ['nom', 'email', 'password'];
    protected $hidden = ['password'];

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    // Relations Droit/Groupe désactivées - tables inexistantes
    // public function droits() { return $this->belongsToMany(Droit::class, 'user_droits'); }
    // public function groupes() { return $this->belongsToMany(Groupe::class, 'user_groupes'); }
}
