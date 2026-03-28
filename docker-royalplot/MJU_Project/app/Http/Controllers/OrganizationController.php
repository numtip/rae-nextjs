<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class OrganizationController extends Controller
{
public function index()
{
    if (! Schema::hasTable('mju_organization')) {
        return Inertia::render('About/Structure', [
            'orgs' => collect(),
        ]);
    }

    $orgs = DB::table('mju_organization')
        ->orderByRaw("
            CASE
                WHEN title LIKE '%อธิการบดี%' THEN 1
                WHEN title LIKE '%รองอธิการบดี%' THEN 2
                WHEN title LIKE '%ผู้อำนวยการสำนัก%' THEN 3
                WHEN title LIKE '%รองผู้อำนวยการ%' THEN 4
                WHEN title LIKE '%หัวหน้างาน%' THEN 5
                ELSE 6
            END
        ")
        ->get();

    return Inertia::render('About/Structure', [
        'orgs' => $orgs
    ]);
}

}
