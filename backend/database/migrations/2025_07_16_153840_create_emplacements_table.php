<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEmplacementsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('emplacements', function (Blueprint $table) {
             $table->id(); // Colonne id
            $table->string('nom_emplacement')->unique(); // Colonne nom_emplacement unique
            $table->boolean('statut')->default(1); // Colonne statut avec valeur par défaut à 1
            $table->timestamps(); // Ajoute created_at et updated_at automatiquement
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('emplacements');
    }
}
