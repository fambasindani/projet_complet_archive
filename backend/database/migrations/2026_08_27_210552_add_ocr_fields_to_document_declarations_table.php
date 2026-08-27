<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddOcrFieldsToDocumentDeclarationsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('document_declarations', function (Blueprint $table) {
            $table->string('ocr_method')->nullable()->after('montext');
            $table->string('ocr_status')->nullable()->after('ocr_method');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('document_declarations', function (Blueprint $table) {
            $table->dropColumn(['ocr_method', 'ocr_status']);
        });
    }
}
