<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('center_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('org')->nullable();
            $table->string('email');
            $table->string('phone');
            $table->json('centers')->nullable();
            $table->json('activities')->nullable();
            $table->string('level')->nullable();
            $table->unsignedInteger('people')->nullable();
            $table->string('food_package')->nullable();
            $table->decimal('price_per_person', 10, 2)->nullable();
            $table->decimal('total_price', 10, 2)->nullable();
            $table->string('status')->nullable();
            $table->text('admin_note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('center_bookings');
    }
};
