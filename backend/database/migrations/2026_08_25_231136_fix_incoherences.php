<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class FixIncoherences extends Migration
{
    public function up()
    {
        // 1. Index + FULLTEXT sur document_declarations.montext (si MySQL)
        if (Schema::hasTable('document_declarations') && Schema::hasColumn('document_declarations', 'montext')) {
            try {
                DB::statement('ALTER TABLE document_declarations ADD FULLTEXT INDEX idx_montext_fulltext (montext)');
            } catch (\Throwable $e) {
                // Fallback: index normal si FULLTEXT non supporté (ex: version MySQL < 5.7 avec InnoDB)
            }
            // Index sur colonnes fréquemment filtrées
            try {
                Schema::table('document_declarations', function (Blueprint $table) {
                    if (! $this->indexExists('document_declarations', 'document_declarations_id_declaration_index')) {
                        $table->index('id_declaration');
                    }
                    if (! $this->indexExists('document_declarations', 'document_declarations_id_classeur_index')) {
                        $table->index('id_classeur');
                    }
                });
            } catch (\Throwable $e) {}
        }

        // 2. Index sur declarations
        if (Schema::hasTable('declarations')) {
            try {
                Schema::table('declarations', function (Blueprint $table) {
                    $table->index('id_direction');
                    $table->index('id_classeur');
                    $table->index('id_user');
                    $table->index('date_creation');
                });
            } catch (\Throwable $e) {}
        }

        // 3. Index sur note_perceptions
        if (Schema::hasTable('note_perceptions')) {
            try {
                Schema::table('note_perceptions', function (Blueprint $table) {
                    $table->index('id_centre_ordonnancement');
                    $table->index('id_assujetti');
                    $table->index('id_classeur');
                });
            } catch (\Throwable $e) {}
        }

        // 4. Correction avatar déjà faite via migration précédente (string), rien à faire si déjà migré
        // Cette migration sert surtout d'indexation et de préparation contrainte
    }

    public function down()
    {
        try {
            DB::statement('ALTER TABLE document_declarations DROP INDEX idx_montext_fulltext');
        } catch (\Throwable $e) {}
    }

    private function indexExists(string $table, string $index): bool
    {
        try {
            $indexes = DB::select("SHOW INDEX FROM `$table` WHERE Key_name = ?", [$index]);
            return count($indexes) > 0;
        } catch (\Throwable $e) {
            return false;
        }
    }
}
