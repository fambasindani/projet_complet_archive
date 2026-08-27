<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDocumentScannesTable extends Migration
{
    /**
     * Run the migrations.
     * Harmonisé avec App\Models\DocumentScanne (table document_scannes)
     *
     * @return void
     */
    public function up()
    {
        Schema::create('document_scannes', function (Blueprint $table) {
            $table->id();
            $table->string('nom_fichier');
            $table->string('nom_original')->nullable();
            $table->string('chemin_fichier');
            $table->string('dossier')->nullable();
            $table->unsignedInteger('pages')->default(1);
            $table->decimal('taille_mo', 8, 2)->default(0);
            $table->string('type_document')->default('pdf');
            $table->foreignId('id_declaration')->nullable()->constrained('declarations')->nullOnDelete();
            $table->foreignId('id_classeur')->nullable()->constrained('classeurs')->nullOnDelete();
            $table->foreignId('uploaded_by')->nullable()->constrained('monutilisateurs')->nullOnDelete();
            $table->timestamp('scanned_at')->nullable();
            $table->string('source_scanner')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['id_classeur', 'created_at']);
            $table->index('id_declaration');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('document_scannes');
    }
}
