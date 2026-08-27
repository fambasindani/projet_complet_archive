<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDocumentNotePerceptionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('document_note_perceptions', function (Blueprint $table) {
             $table->id();
             $table->integer('id_note_perception');
             $table->integer('id_classeur');
             $table->integer('id_ministere');
             $table->string('nom_fichier');      // nom généré
             $table->string('nom_native');       // nom original
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
        Schema::dropIfExists('document_note_perceptions');
    }
}
