<?php

namespace App\Models;

/**
 * @deprecated Legacy - Utiliser MonUtilisateur comme unique modèle d'authentification.
 * Ce fichier est conservé pour compatibilité mais ne doit plus être utilisé.
 * Voir config/auth.php -> providers.users.model = MonUtilisateur::class
 */
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];
}
