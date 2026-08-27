<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string|null
     */
    protected function redirectTo($request)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            return null;
        }
        // Pour les requêtes API sans Accept: application/json (ex: window.open), ne pas rediriger vers route('login') inexistante
        if ($request->is('api/*')) {
            return null;
        }
        if (! $request->expectsJson()) {
            // Vérifie que la route login existe avant de l'appeler
            if (app('router')->has('login')) {
                return route('login');
            }
            return null;
        }
    }
}
