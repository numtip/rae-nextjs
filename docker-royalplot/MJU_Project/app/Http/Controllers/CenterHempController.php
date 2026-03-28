<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class CenterHempController extends Controller
{
    public function index()
    {
        $required = [
            'mju_hemp_research_and_development_center_detail',
            'mju_hemp_research_and_development_center_activities',
            'mju_demo_plot_fees',
            'mju_map_mark',
        ];
        foreach ($required as $t) {
            if (! Schema::hasTable($t)) {
                return Inertia::render('Center/HempCenter', [
                    'detail' => null,
                    'activities' => collect(),
                    'fees' => collect(),
                    'pins' => collect(),
                ]);
            }
        }

$detailRaw = DB::table('mju_hemp_research_and_development_center_detail')->first();

$activities = DB::table('mju_hemp_research_and_development_center_activities')
            ->select('id', 'activity_name', 'description', 'location_name', 'duration', 'participants_count')
            ->get();

        $fees = DB::table('mju_demo_plot_fees')->get();

        $pins = DB::table('mju_map_mark as m')
            ->join('mju_hemp_research_and_development_center_activities as a', 'm.activity_id', '=', 'a.id')
            ->where('m.center_id', 5)
            ->select(
                'm.id',
                'm.center_id',
                'm.activity_id',
                'm.x_percent',
                'm.y_percent',
                'a.activity_name as title',
                'a.description'
            )
            ->get();

        $detail = null;

        if ($detailRaw) {
            $detail = [
                'id' => $detailRaw->id ?? null,
                'center_name' => $detailRaw->center_name,
                'center_description' => $detailRaw->history,
                'affiliation' => $detailRaw->affiliation,
                'history' => $detailRaw->history,
                'objective' => $detailRaw->objective,
                'video_url' => $detailRaw->video_url,
                'map_image' => $detailRaw->map_image ? 'data:image/jpeg;base64,' . base64_encode($detailRaw->map_image) : null,
                'image1' => $detailRaw->image1 ? 'data:image/jpeg;base64,' . base64_encode($detailRaw->image1) : null,
                'image2' => $detailRaw->image2 ? 'data:image/jpeg;base64,' . base64_encode($detailRaw->image2) : null,
                'image3' => $detailRaw->image3 ? 'data:image/jpeg;base64,' . base64_encode($detailRaw->image3) : null,
            ];
        }

        return Inertia::render('Center/HempCenter', [
            'detail'     => $detail,
            'activities' => $activities,
            'fees'       => $fees,
            'pins'       => $pins
        ]);
    }
}
