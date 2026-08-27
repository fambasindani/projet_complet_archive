<?php




use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDirectionUserTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
       Schema::create('direction_user', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('direction_id');
    $table->unsignedBigInteger('user_id');
    $table->timestamps();

    $table->foreign('direction_id')
          ->references('id')->on('departements')
          ->onDelete('cascade');

    $table->foreign('user_id')
          ->references('id')->on('monutilisateurs')
          ->onDelete('cascade');

    $table->unique(['direction_id', 'user_id']);
});

    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('direction_user');
    }
}
