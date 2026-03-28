<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mju_pr_news', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('event_date')->nullable();
            foreach (['image1', 'image2', 'image3', 'image4', 'image5'] as $col) {
                $table->binary($col)->nullable();
            }
            $table->timestamps();
        });

        Schema::create('mju_activity_news', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            foreach (['image1', 'image2', 'image3', 'image4', 'image5'] as $col) {
                $table->binary($col)->nullable();
            }
            $table->timestamps();
        });

        Schema::create('mju_articles', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            foreach (['image1', 'image2', 'image3', 'image4', 'image5'] as $col) {
                $table->binary($col)->nullable();
            }
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mju_articles');
        Schema::dropIfExists('mju_activity_news');
        Schema::dropIfExists('mju_pr_news');
    }
};
