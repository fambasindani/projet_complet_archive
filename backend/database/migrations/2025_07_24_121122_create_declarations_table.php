<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDeclarationsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('declarations', function (Blueprint $table) {
               $table->id();
              $table->integer('id_direction');
              $table->integer('id_emplacement');
              $table->integer('id_classeur');
              $table->integer('id_user');
             $table->date('date_creation');
              $table->date('date_enregistrement');
             $table->string('intitule');
            $table->string('num_reference');
            $table->string('mot_cle');
            $table->string('num_declaration');
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
        Schema::dropIfExists('declarations');
    }
}
