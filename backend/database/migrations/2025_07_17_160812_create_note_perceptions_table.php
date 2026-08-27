<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateNotePerceptionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('note_perceptions', function (Blueprint $table) {
          
          
            $table->id();
            $table->boolean('statut')->default(1);
            $table->integer('id_classeur');
            $table->integer('id_user')->nullable();
            $table->integer('id_centre_ordonnancement')->nullable();
            $table->integer('id_assujetti')->nullable();
            $table->integer('id_emplacement')->nullable();
            $table ->integer('id_ministere');
            $table->string('numero_article')->nullable();;
            $table->string('numero_serie');
            $table->date('date_ordonnancement');
            $table->dateTime('date_enregistrement');
         
         

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
        Schema::dropIfExists('note_perceptions');
    }
}
