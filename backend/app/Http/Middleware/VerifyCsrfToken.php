<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        //// 'api/connexion', // ou 'connexion' selon votre route
       // 'connexion',
      'api/*',  // Désactive CSRF pour TOUTES les routes commençant par api/

    ];
}
