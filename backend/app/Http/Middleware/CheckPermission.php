<?php
// app/Http/Middleware/CheckPermission.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckPermission
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, $permission)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Token manquant ou invalide. Veuillez vous connecter.'
            ], 401);
        }

        // Vérification token ability si présente, sinon fallback DB (compatibilité)
        $token = $user->currentAccessToken();
        if ($token && method_exists($token, 'can') && !empty($token->abilities) && $token->abilities !== ['*']) {
            if (!$token->can($permission) && !$user->hasPermission($permission)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'avez pas les droits pour accéder à cette page.'
                ], 403);
            }
        } else {
            if (!$user->hasPermission($permission)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'avez pas les droits pour accéder à cette page.'
                ], 403);
            }
        }

        return $next($request);
    }
}