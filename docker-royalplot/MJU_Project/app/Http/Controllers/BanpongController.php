<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class BanpongController extends Controller
{
    public function index()
    {
        $required = [
            'mju_banpong_detail',
            'mju_banpong_activities',
            'mju_demo_plot_fees',
            'mju_map_mark',
        ];
        foreach ($required as $t) {
            if (! Schema::hasTable($t)) {
                return Inertia::render('Center/Banpong', [
                    'detail' => null,
                    'activities' => collect(),
                    'fees' => collect(),
                    'pins' => collect(),
                ]);
            }
        }

        $detailRaw = DB::table('mju_banpong_detail')->first();

        $activities = DB::table('mju_banpong_activities')
            ->select('id', 'activity_name', 'description', 'location_name', 'recommended_time', 'duration', 'participants_count')
            ->get();

        $fees = DB::table('mju_demo_plot_fees')->get();

        $pins = DB::table('mju_map_mark as m')
            ->join('mju_banpong_activities as a', 'm.activity_id', '=', 'a.id')
            ->where('m.center_id', 4)
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
                'id' => $detailRaw->id,
                'center_name' => $detailRaw->center_name,
                'affiliation' => $detailRaw->affiliation,
                'history' => $detailRaw->history,
                'objective' => $detailRaw->objective,
                'location_name' => $detailRaw->location_name,
                'map_url' => $detailRaw->map_url,
                'video_url' => $detailRaw->video_url,
                'image1' => $detailRaw->image1 ? 'data:image/jpeg;base64,' . base64_encode($detailRaw->image1) : null,
                'image2' => $detailRaw->image2 ? 'data:image/jpeg;base64,' . base64_encode($detailRaw->image2) : null,
                'image3' => $detailRaw->image3 ? 'data:image/jpeg;base64,' . base64_encode($detailRaw->image3) : null,
                'map_image' => $detailRaw->map_image ? 'data:image/jpeg;base64,' . base64_encode($detailRaw->map_image) : null,
            ];
        }

        return Inertia::render('Center/Banpong', [
            'detail'     => $detail,
            'activities' => $activities,
            'fees'       => $fees,
            'pins'       => $pins
        ]);
    }
}
