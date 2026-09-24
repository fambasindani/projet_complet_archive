<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;
use App\Models\MonUtilisateur;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Codes de permission utilisés par le frontend (Menus.tsx, LoginScreen.tsx, modales).
     */
    private array $permissionCodes = [
        // Modules / accès généraux
        'dashboard',
        'configuration',
        'utilisateur',
        'role',
        'permission',
        // Archivage (AD)
        'archiv_doc',
        'acceder_au__document',
        'direction',
        'classeur',
        'emplacement',
        'centre',
        'serv_assiette',
        'creer_direction', 'modifier_direction', 'supprimer_direction', 'consulter_direction',
        'creer_classeur', 'modifier_classeur', 'supprimer_classeur', 'consulter_classeur',
        'creer_emplacement', 'modifier_emplacement', 'supprimer_emplacement', 'consulter_emplacement',
        // Notes de perception (NP)
        'note_perception',
        'acceder_au_note_perception',
        'creer_centre', 'modifier_centre', 'supprimer_centre', 'consulter_centre',
        'creer_service_assiette', 'modifier_service_assiette', 'supprimer_service_assiette', 'consulter_service_assiette',
        'creer_note_perception', 'modifier_note_perception', 'supprimer_note_perception', 'consulter_note_perception',
        // Entités transverses
        'creer_assujetti', 'modifier_assujetti', 'supprimer_assujetti', 'consulter_assujetti',
        'creer_article', 'modifier_article', 'supprimer_article', 'consulter_article',
        'creer_document', 'modifier_document', 'supprimer_document', 'consulter_document',
    ];

    public function run()
    {
        // 1. Créer les permissions (idempotent)
        $permissionIds = [];
        foreach ($this->permissionCodes as $code) {
            $perm = Permission::firstOrCreate(
                ['code' => $code],
                ['description' => ucwords(str_replace('_', ' ', $code))]
            );
            $permissionIds[] = $perm->id;
        }

        // 2. Créer le rôle Admin avec TOUTES les permissions
        $adminRole = Role::firstOrCreate(
            ['nom' => 'Admin'],
            ['description' => 'Administrateur complet']
        );
        $adminRole->permissions()->sync($permissionIds);

        // 3. Créer un rôle AD (archivage) et NP (notes) pour tests
        $adRole = Role::firstOrCreate(
            ['nom' => 'Archiviste AD'],
            ['description' => 'Gestion archivage documents']
        );
        $adRole->permissions()->sync(array_map(
            fn($c) => Permission::where('code', $c)->first()?->id,
            ['archiv_doc', 'acceder_au__document', 'dashboard', 'direction', 'classeur', 'emplacement',
             'creer_direction', 'modifier_direction', 'supprimer_direction', 'consulter_direction',
             'creer_classeur', 'modifier_classeur', 'supprimer_classeur', 'consulter_classeur',
             'creer_emplacement', 'modifier_emplacement', 'supprimer_emplacement', 'consulter_emplacement',
             'creer_document', 'modifier_document', 'supprimer_document', 'consulter_document']
        ));

        $npRole = Role::firstOrCreate(
            ['nom' => 'Gestionnaire NP'],
            ['description' => 'Gestion notes de perception']
        );
        $npRole->permissions()->sync(array_map(
            fn($c) => Permission::where('code', $c)->first()?->id,
            ['note_perception', 'acceder_au_note_perception', 'dashboard', 'centre', 'serv_assiette',
             'creer_centre', 'modifier_centre', 'supprimer_centre', 'consulter_centre',
             'creer_service_assiette', 'modifier_service_assiette', 'supprimer_service_assiette', 'consulter_service_assiette',
             'creer_note_perception', 'modifier_note_perception', 'supprimer_note_perception', 'consulter_note_perception']
        ));

        // 4. Assigner le rôle Admin au compte test (et tous les rôles si aucun)
        $user = MonUtilisateur::where('email', 'pierrpapy@gmail.com')->first();
        if ($user && $user->roles()->count() === 0) {
            $user->roles()->attach($adminRole->id);
            $this->command->info("Rôle Admin assigné à {$user->email}");
        }

        $this->command->info('Roles & permissions seedés : ' . count($permissionIds) . ' permissions, rôles Admin/AD/NP créés.');
    }
}
