<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAssujettisTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('assujettis', function (Blueprint $table) {
          
          $table->id();
          $table->string('numero_nif')->nullable();
          $table->string('nom_raison_sociale');
          $table->string('bp')->nullable();
          $table->string('telephone'); // obligatoire
          $table->string('email')->nullable();
          $table->boolean('statut')->default(1);
          $table->timestamps();


        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('assujettis');
    }
}
