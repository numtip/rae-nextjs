<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class ActivityController extends Controller
{
    public function show($centerId, $id)
    {
        $tables = [
            1 => 'mju_agriculture_theory_activities',
            2 => 'mju_farm_demo_activities',
            3 => 'mju_culture_agriculture_center_activities',
            4 => 'mju_banpong_activities',
            5 => 'mju_hemp_research_and_development_center_activities',
        ];

        if (!isset($tables[$centerId])) {
            abort(404);
        }

        $tbl = $tables[$centerId];
        if (! Schema::hasTable($tbl)) {
            abort(404);
        }

        $activityRaw = DB::table($tbl)
            ->where('id', $id)
            ->first();

        if (!$activityRaw) {
            abort(404);
        }

        $encode = function ($img) {
            if (!$img) return null;
            return 'data:image/jpeg;base64,' . base64_encode($img);
        };

        $activity = [
            'id' => $activityRaw->id ?? null,
            'activity_name' => $activityRaw->activity_name ?? null,
            'description' => $activityRaw->description ?? null,
            'location_name' => $activityRaw->location_name ?? null,
            'location_link' => $activityRaw->location_link ?? null,
            'instructor' => $activityRaw->instructor ?? null,
            'duration' => $activityRaw->duration ?? null,
            'participants_count' => $activityRaw->participants_count ?? null,
            'recommended_time' => $activityRaw->recommended_time ?? null,

            'images' => array_values(array_filter([
                $encode($activityRaw->image1 ?? $activityRaw->image ?? null),
                $encode($activityRaw->image2 ?? null),
                $encode($activityRaw->image3 ?? null),
                $encode($activityRaw->image4 ?? null),
                $encode($activityRaw->image5 ?? null),
            ]))
        ];

        return Inertia::render('Center/ActivityDetail', [
            'activity' => $activity
        ]);
    }
}
