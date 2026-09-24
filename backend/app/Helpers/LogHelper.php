<?php

namespace App\Helpers;

use App\Models\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class LogHelper
{
    public static function log(string $action, string $tableName, ?int $recordId = null, ?string $description = null): Log
    {
        return Log::create([
            'user_id'     => Auth::id(),
            'action'      => $action,
            'table_name'  => $tableName,
            'record_id'   => $recordId,
            'description' => $description,
            'ip_address'  => Request::ip(),
            'user_agent'  => Request::userAgent(),
        ]);
    }

    public static function create(string $tableName, ?int $recordId = null, ?string $description = null): Log
    {
        return self::log('CREATE', $tableName, $recordId, $description);
    }

    public static function update(string $tableName, ?int $recordId = null, ?string $description = null): Log
    {
        return self::log('UPDATE', $tableName, $recordId, $description);
    }

    public static function delete(string $tableName, ?int $recordId = null, ?string $description = null): Log
    {
        return self::log('DELETE', $tableName, $recordId, $description);
    }

    public static function login(?string $description = null): Log
    {
        return self::log('LOGIN', 'MonUtilisateurs', Auth::id(), $description ?? 'Connexion réussie');
    }

    public static function logout(?string $description = null): Log
    {
        return self::log('LOGOUT', 'MonUtilisateurs', Auth::id(), $description ?? 'Déconnexion');
    }
}

