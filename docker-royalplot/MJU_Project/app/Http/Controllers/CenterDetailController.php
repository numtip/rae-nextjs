<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CenterDetailController extends Controller
{
    // ===== 1. หน้าแยกแต่ละศูนย์ =====

    public function lanna()
    {
        return $this->getCenter(
            'mju_culture_agriculture_center_detail',
            'Center/LannaDetail',
            'mju_history_lanna'
        );
    }

    public function royal()
    {
        return $this->getCenter(
            'mju_agriculture_theory_detail',
            'Center/RoyalDetail',
            'mju_history_theory'
        );
    }

    public function farm()
    {
        return $this->getCenter(
            'mju_farm_demo_detail',
            'Center/FarmDetail',
            'mju_history_farm' // ✅ ใช้อันนี้ตัวเดียว
        );
    }

    public function banpong()
    {
        return $this->getCenter(
            'mju_banpong_detail',
            'Center/BanpongDetail',
            'mju_history_huayjo'
        );
    }

    public function hemp()
    {
        return $this->getCenter(
            'mju_hemp_research_and_development_center_detail',
            'Center/HempDetail',
            'mju_history_hemp' // ✅ ใช้อันนี้ตัวเดียว
        );
    }

    // ===== 2. function กลาง =====

    private function getCenter($table, $view, $historyTable = null)
    {
        if (! Schema::hasTable($table)) {
            return Inertia::render($view, [
                'detail' => null,
                'historyData' => collect(),
            ]);
        }

        $row = DB::table($table)->first();

        $detail = null;

        if ($row) {
            $detail = [
                'id' => $row->id,
                'center_name' => $row->center_name,
                'affiliation' => $row->affiliation,
                'history' => $row->history,
                'objective' => $row->objective,

                'image1' => $row->image1 ? 'data:image/jpeg;base64,' . base64_encode($row->image1) : null,
                'image2' => $row->image2 ? 'data:image/jpeg;base64,' . base64_encode($row->image2) : null,
                'image3' => $row->image3 ? 'data:image/jpeg;base64,' . base64_encode($row->image3) : null,
            ];
        }

        // ===== 🔥 history =====
        $historyData = [];

        if ($historyTable && Schema::hasTable($historyTable)) {
            $historyData = DB::table($historyTable)
                ->orderBy('year', 'asc')
                ->get()
                ->map(function ($item) {
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

        return Inertia::render($view, [
            'detail' => $detail,
            'historyData' => $historyData
        ]);
    }
}
