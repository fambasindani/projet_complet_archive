<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateClasseursTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('classeurs', function (Blueprint $table) {
             $table->id();
            $table->string('nom_classeur');
            $table->boolean('statut')->nullable(); // Statut est un booléen et nullable
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
        Schema::dropIfExists('classeurs');
    }
}
