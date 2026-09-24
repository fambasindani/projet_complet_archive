<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    
    protected $fillable = ['nom', 'description'];

    protected $withCount = ['MonUtilisateurs'];

    public function MonUtilisateurs()
    {
        return $this->belongsToMany(MonUtilisateur::class, 'user_role', 'role_id', 'user_id');
    }

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permission', 'role_id', 'permission_id');
    }


   

}

