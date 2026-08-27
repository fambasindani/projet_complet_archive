<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCentreOrdonnancementsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('centre_ordonnancements', function (Blueprint $table) {
            $table->id();
            $table->integer('id_ministere');
            $table->string('nom');
             $table->string('description');
            $table->string('statut')->nullable();
            $table->timestamps(); // Pour created_at et updated_at


        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('centre_ordonnancements');
    }
}
