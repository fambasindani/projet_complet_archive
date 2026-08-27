<?php
// app/Models/MonUtilisateur.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class MonUtilisateur extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'monutilisateurs';
    
    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'password',
        'statut',
        'datecreation',
        'dernierconnection',
        'avatar'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'datecreation' => 'datetime',
        'dernierconnection' => 'datetime',
        'statut' => 'string'
    ];

    protected $appends = ['full_name'];

    // ==================== RELATIONS ====================

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_role', 'user_id', 'role_id');
    }

    public function departements()
    {
        return $this->belongsToMany(Departement::class, 'direction_user', 'user_id', 'direction_id');
    }

    public function declarations()
    {
        return $this->hasMany(Declaration::class, 'id_user');
    }

    // ==================== ACCESSORS ====================

    public function getFullNameAttribute()
    {
        return $this->prenom . ' ' . $this->nom;
    }

    public function getPrincipalDepartementAttribute()
    {
        return $this->departements()->first();
    }

    public function getDepartementsSiglesAttribute()
    {
        return $this->departements->pluck('sigle')->implode(', ');
    }

    // ==================== SCOPES ====================

    public function scopeActive($query)
    {
        return $query->where('statut', 'active');
    }

    public function scopeInactive($query)
    {
        return $query->where('statut', 'inactive');
    }

    public function scopeBlocked($query)
    {
        return $query->where('statut', 'bloqué');
    }

    public function scopeByDepartement($query, $departementId)
    {
        return $query->whereHas('departements', function($q) use ($departementId) {
            $q->where('departements.id', $departementId);
        });
    }

    // ==================== MÉTHODES DE PERMISSION ====================

    /**
     * Vérifie si l'utilisateur a une permission spécifique
     * 
     * @param string $permissionCode
     * @return bool
     */
    public function hasPermission($permissionCode)
    {
        return $this->roles()
            ->whereHas('permissions', function ($query) use ($permissionCode) {
                $query->where('code', $permissionCode);
            })
            ->exists();
    }

    /**
     * Vérifie si l'utilisateur a au moins une des permissions
     * 
     * @param array $permissions
     * @return bool
     */
    public function hasAnyPermission(array $permissions)
    {
        return $this->roles()
            ->whereHas('permissions', function ($query) use ($permissions) {
                $query->whereIn('code', $permissions);
            })
            ->exists();
    }

    /**
     * Vérifie si l'utilisateur a toutes les permissions
     * 
     * @param array $permissions
     * @return bool
     */
    public function hasAllPermissions(array $permissions)
    {
        foreach ($permissions as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Récupère toutes les permissions de l'utilisateur
     * 
     * @return array
     */
    public function getAllPermissions()
    {
        return $this->roles()
            ->with('permissions')
            ->get()
            ->pluck('permissions')
            ->flatten()
            ->unique('id')
            ->values();
    }

    /**
     * Récupère tous les codes de permission de l'utilisateur
     * 
     * @return array
     */
    public function getAllPermissionCodes()
    {
        return $this->getAllPermissions()->pluck('code')->toArray();
    }

    // ==================== AUTRES MÉTHODES ====================

    public function hasRole($roleName)
    {
        return $this->roles()->where('nom', $roleName)->exists();
    }

    public function estDansDepartement($departementId)
    {
        return $this->departements()->where('departements.id', $departementId)->exists();
    }
}