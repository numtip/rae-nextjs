<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class HistoryController extends Controller
{
    private function formatData($rows)
    {
        return collect($rows)->map(function ($item) {
            return [
                'id' => $item->id,
                'year' => $item->year,
                'title' => $item->title,
                'description' => $item->description,
                'imageUrl' => $item->image
                    ? 'data:image/jpeg;base64,' . base64_encode($item->image)
                    : null,
            ];
        });
    }

    public function theory()
    {
        if (! Schema::hasTable('mju_history_theory')) {
            return Inertia::render('History/Theory', ['historyData' => collect()]);
        }

        $data = DB::table('mju_history_theory')->get();
        return Inertia::render('History/Theory', [
            'historyData' => $this->formatData($data)
        ]);
    }

    public function lanna()
    {
        if (! Schema::hasTable('mju_history_lanna')) {
            return Inertia::render('History/Lanna', ['historyData' => collect()]);
        }

        $data = DB::table('mju_history_lanna')->get();
        return Inertia::render('History/Lanna', [
            'historyData' => $this->formatData($data)
        ]);
    }

    public function huayjo()
    {
        if (! Schema::hasTable('mju_history_huayjo')) {
            return Inertia::render('History/Huayjo', ['historyData' => collect()]);
        }

        $data = DB::table('mju_history_huayjo')->get();
        return Inertia::render('History/Huayjo', [
            'historyData' => $this->formatData($data)
        ]);
    }
}
