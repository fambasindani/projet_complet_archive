<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDocumentDeclarationsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('document_declarations', function (Blueprint $table) {
             $table->id();
             $table->integer('id_classeur');
             $table->integer('id_declaration');
             $table->string('nom_fichier');      // nom généré  
             $table->string('nom_native');       // nom original
             $table->decimal('taille', 10, 2); // ex: 2.35 Mo    // nom original
             $table->text('montext')->nullable();
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
        Schema::dropIfExists('document_declarations');
    }
}
