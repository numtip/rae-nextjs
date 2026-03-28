<?php

namespace App\Http\Controllers;

use App\Models\MjuHistory;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class MjuHistoryController extends Controller
{
    public function index()
    {
        if (! Schema::hasTable('mju_history')) {
            return Inertia::render('About/History', [
                'historyData' => collect(),
            ]);
        }

        $histories = MjuHistory::orderBy('year')->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'year' => $item->year,
                'title' => $item->title,
                'description' => $item->description,
                'imageUrl' => $item->image
                    ? 'data:image/jpeg;base64,' . base64_encode($item->image)
                    : null,
                'imageAlt' => $item->image_alt
            ];
        });

        return Inertia::render('About/History', [
            'historyData' => $histories
        ]);
    }
}
