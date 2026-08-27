<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddTailleAndMontextToDocumentNotePerceptionsTable extends Migration
{
    public function up()
    {
        Schema::table('document_note_perceptions', function (Blueprint $table) {
            $table->bigInteger('taille')->default(0)->after('nom_native');
            $table->longText('montext')->nullable()->after('taille');
        });
    }

    public function down()
    {
        Schema::table('document_note_perceptions', function (Blueprint $table) {
            $table->dropColumn(['taille', 'montext']);
        });
    }
}
