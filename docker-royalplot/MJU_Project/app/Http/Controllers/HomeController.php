<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\MjuCalendarBlock;
use App\Models\Promotion; // 🔥 เพิ่มการเรียกใช้ Model Promotion ของตารางใหม่
use Carbon\Carbon;

class HomeController extends Controller
{
    public function index()
    {
        $today = Carbon::today()->toDateString();

        // =========================
        // PR NEWS (เฉพาะยังไม่หมดอายุ)
        // =========================
        $prNews = DB::table('mju_pr_news')
            ->where(function ($q) use ($today) {
                $q->whereNull('event_date')
                  ->orWhere('event_date', '>=', $today);
            })
            ->orderByDesc('event_date')
            ->limit(6)
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'title' => $row->title,
                    'description' => $row->description,
                    'event_date' => $row->event_date,
                    'image' => $row->image1
                        ? 'data:image/jpeg;base64,' . base64_encode($row->image1)
                        : null,
                    'type' => 'pr'
                ];
            });

        // =========================
        // ACTIVITY NEWS (กิจกรรม)
        // =========================
        $actNews = DB::table('mju_activity_news')
            ->orderByDesc('id')
            ->limit(6)
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'title' => $row->title,
                    'description' => $row->description,
                    'image' => $row->image1
                        ? 'data:image/jpeg;base64,' . base64_encode($row->image1)
                        : null,
                    'type' => 'activity'
                ];
            });

        // =========================
        // ARTICLES
        // =========================
        $articles = DB::table('mju_articles')
            ->orderByDesc('id')
            ->limit(6)
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'title' => $row->title,
                    'description' => $row->description,
                    'image' => $row->image1
                        ? 'data:image/jpeg;base64,' . base64_encode($row->image1)
                        : null,
                ];
            });

        // =========================
        // PRODUCT PROMOTIONS (🔥 ดึงจากตารางใหม่ promotions คอลัมน์ type = shop)
        // =========================
        $productPromotions = Promotion::where('type', 'shop')
            ->where('status', true)
            ->where(function($query) use ($today) {
                $query->whereNull('end_date')
                      ->orWhere('end_date', '>=', $today);
            })
            ->orderByDesc('created_at')
            ->limit(12)
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'title' => $row->title,
                    'description' => $row->description,
                    'image' => $row->image, // ใช้งานเป็น path รูปได้เลย ไม่ต้องแปลง base64 แล้ว
                ];
            });

        // =========================
        // CENTER PROMOTIONS (🔥 ดึงจากตารางใหม่ promotions คอลัมน์ type = center)
        // =========================
        $centerPromotions = Promotion::where('type', 'center')
            ->where('status', true)
            ->where(function($query) use ($today) {
                $query->whereNull('end_date')
                      ->orWhere('end_date', '>=', $today);
            })
            ->orderByDesc('created_at')
            ->limit(12)
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'title' => $row->title,
                    'description' => $row->description,
                    'image' => $row->image, // ใช้งานเป็น path รูปได้เลย ไม่ต้องแปลง base64 แล้ว
                ];
            });

        // =========================
        // ดึงข้อมูลวันหยุด / คิวเต็ม สำหรับปฏิทินหน้าแรก
        // =========================
        $blockedDates = [];
        if (Schema::hasTable('mju_calendar_blocks')) {
            $blocks = MjuCalendarBlock::get(['blocked_date', 'reason']);
            foreach ($blocks as $block) {
                $dateString = Carbon::parse($block->blocked_date)->format('Y-m-d');
                $blockedDates[$dateString] = $block->reason;
            }
        }

        // =========================
        // 🔥 ดึงข้อมูลวิดีโอ ศูนย์ทดสอบ วิจัยและพัฒนากัญชง
        // =========================
        $hempVideoUrl = null;
        if (Schema::hasTable('mju_hemp_research_and_development_center_detail')) {
            // ดึงค่า video_url จากแถวแรกสุด (หรือระบุ ID ตามต้องการ)
            $hempVideoUrl = DB::table('mju_hemp_research_and_development_center_detail')->value('video_url');
        }

        return Inertia::render('Home', [
            'prNews' => $prNews,
            'actNews' => $actNews,
            'articles' => $articles,
            'productPromotions' => $productPromotions,
            'centerPromotions' => $centerPromotions,
            'bookedDates' => (object)$blockedDates,
            'hempVideoUrl' => $hempVideoUrl, // 🔥 ส่งค่า URL วิดีโอไปให้ Vue
        ]);
    }

    public function getSlides()
    {
        if (! Schema::hasTable('mju_previewimage')) {
            return response()->json([]);
        }

        $rows = DB::table('mju_previewimage')->orderBy('id')->get();
        $images = [];

        foreach ($rows as $row) {
            $binary = $row->image;
            $base64 = base64_encode($binary);
            $mime = (new \finfo(FILEINFO_MIME_TYPE))->buffer($binary);

            $images[] = [
                'id' => $row->id,
                'title' => $row->title,
                'image' => 'data:' . $mime . ';base64,' . $base64
            ];
        }

        return response()->json($images);
    }

    public function prDetail($id)
    {
        $row = DB::table('mju_pr_news')->where('id', $id)->first();
        abort_if(!$row, 404);

        return Inertia::render('News/PrDetail', [
            'news' => [
                'id' => $row->id,
                'title' => $row->title,
                'description' => $row->description,
                'event_date' => $row->event_date,
                'image' => $row->image1
                    ? 'data:image/jpeg;base64,' . base64_encode($row->image1)
                    : null,
            ]
        ]);
    }

    public function prAll()
    {
        $news = DB::table('mju_pr_news')
            ->orderByDesc('event_date')
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'title' => $row->title,
                    'description' => $row->description,
                    'event_date' => $row->event_date,
                    'image' => $row->image1
                        ? 'data:image/jpeg;base64,' . base64_encode($row->image1)
                        : null,
                ];
            });

        return Inertia::render('News/PrAll', [
            'news' => $news
        ]);
    }

    public function activityDetail($id)
    {
        $row = DB::table('mju_activity_news')->where('id', $id)->first();

        if (!$row) {
            $row = DB::table('mju_pr_news')->where('id', $id)->first();
        }

        abort_if(!$row, 404);

        return Inertia::render('News/ActivityDetail', [
            'news' => [
                'id' => $row->id,
                'title' => $row->title,
                'description' => $row->description,
                'image' => $row->image1
                    ? 'data:image/jpeg;base64,' . base64_encode($row->image1)
                    : null,
            ]
        ]);
    }

    public function activityAll()
    {
        $news = DB::table('mju_activity_news')
            ->orderByDesc('id')
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'title' => $row->title,
                    'description' => $row->description,
                    'image' => $row->image1
                        ? 'data:image/jpeg;base64,' . base64_encode($row->image1)
                        : null,
                ];
            });

        return Inertia::render('News/ActivityAll', [
            'news' => $news
        ]);
    }

    public function articleAll()
    {
        $articles = DB::table('mju_articles')
            ->orderByDesc('id')
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'title' => $row->title,
                    'description' => $row->description,
                    'image' => $row->image1
                        ? 'data:image/jpeg;base64,' . base64_encode($row->image1)
                        : null,
                ];
            });

        return Inertia::render('Articles/All', [
            'articles' => $articles
        ]);
    }

    public function articleDetail($id)
    {
        $row = DB::table('mju_articles')->where('id', $id)->first();
        abort_if(!$row, 404);

        return Inertia::render('Articles/Detail', [
            'article' => [
                'id' => $row->id,
                'title' => $row->title,
                'description' => $row->description,
                'image' => $row->image1
                    ? 'data:image/jpeg;base64,' . base64_encode($row->image1)
                    : null,
            ]
        ]);
    }
}
