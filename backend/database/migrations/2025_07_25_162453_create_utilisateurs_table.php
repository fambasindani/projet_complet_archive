<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUtilisateursTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('utilisateurs', function (Blueprint $table) {
          $table->id();
          $table->integer('id_direction')->nullable(); // Correction : ajout d'un '>' après 'integer'
          $table->integer('id_centre')->nullable(); // Pas de modification ici
          $table->string('nom'); // Correction : ajout d'un '>' après 'string'
          $table->string('prenom'); // Pas de modification ici
          $table->string('email')->unique(); // Pas de modification ici
          $table->string('password'); // Pas de modification ici
          $table->string('role'); // Pas de modification ici
          $table->string('statut'); // Pas de modification ici
          $table->boolean('entreprise'); // Pas de modification ici
          $table->timestamps(); // Pas de modification ici
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('utilisateurs');
    }
}
