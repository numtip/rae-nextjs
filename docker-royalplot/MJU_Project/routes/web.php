<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

use App\Http\Controllers\HomeController;
use App\Http\Controllers\HistoryController as PublicHistoryController;
use App\Http\Controllers\MjuHistoryController;
use App\Http\Controllers\MjuVisionController;
use App\Http\Controllers\AboutController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\PreviewVideoController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\MjuOrderController;
use App\Http\Controllers\LannaController;
use App\Http\Controllers\AgricultureTheoryController;
use App\Http\Controllers\FarmController;
use App\Http\Controllers\BanpongController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\ActivityController as PublicActivityController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CenterDetailController;
use App\Http\Controllers\CenterHempController;

use App\Http\Controllers\SuperAdmin\UserController;
use App\Http\Controllers\SuperAdmin\DashboardController;
use App\Http\Controllers\SuperAdmin\BookingController as SuperAdminBookingController;
use App\Http\Controllers\SuperAdmin\MapController;
use App\Http\Controllers\SuperAdmin\ActivityController as SuperAdminActivityController;
use App\Http\Controllers\SuperAdmin\ProductController;
use App\Http\Controllers\SuperAdmin\SlideController;
use App\Http\Controllers\SuperAdmin\VideoController;
use App\Http\Controllers\SuperAdmin\PrController;
use App\Http\Controllers\SuperAdmin\ActivityNewsController;
use App\Http\Controllers\SuperAdmin\ArticleController;
use App\Http\Controllers\SuperAdmin\HistoryController as SuperAdminHistoryController;
use App\Http\Controllers\SuperAdmin\PersonnelController;
use App\Http\Controllers\SuperAdmin\VisionController;
use App\Http\Controllers\SuperAdmin\PlotFeeController;
use App\Http\Controllers\SuperAdmin\OrderSlipController;
use App\Http\Controllers\SuperAdmin\CenterAdminController;
use App\Http\Controllers\SuperAdmin\PromotionController;

Route::get('/', [HomeController::class, 'index']);
Route::get('/slides', [HomeController::class, 'getSlides']);

Route::prefix('news')->group(function () {
    Route::get('/pr', [HomeController::class, 'prAll']);
    Route::get('/activity', [HomeController::class, 'activityAll']);
    Route::get('/pr/detail/{id}', [HomeController::class, 'prDetail']);
    Route::get('/activity/detail/{id}', [HomeController::class, 'activityDetail']);
});

Route::get('/articles', [HomeController::class, 'articleAll'])->name('articles.all');
Route::get('/articles/{id}', [HomeController::class, 'articleDetail'])->name('articles.detail');

Route::get('/about/vision', [MjuVisionController::class, 'index']);
Route::get('/about/philosophy', [MjuVisionController::class, 'index']);
Route::get('/about/mission', [MjuVisionController::class, 'index']);
Route::get('/about/structure', [OrganizationController::class, 'index']);
Route::get('/about/history', [MjuHistoryController::class, 'index']);
Route::get('/about/addmin', [AboutController::class, 'admin']);
Route::get('/about/research', [AboutController::class, 'research']);
Route::get('/about/service', [AboutController::class, 'service']);
Route::get('/about/farmadmin', [AboutController::class, 'farmadmin']);
Route::get('/history/theory', [PublicHistoryController::class, 'theory']);
Route::get('/history/lanna', [PublicHistoryController::class, 'lanna']);
Route::get('/history/huayjo', [PublicHistoryController::class, 'huayjo']);

Route::get('/center-detail/lanna', [CenterDetailController::class, 'lanna']);
Route::get('/center-detail/royal', [CenterDetailController::class, 'royal']);
Route::get('/center-detail/farm', [CenterDetailController::class, 'farm']);
Route::get('/center-detail/banpong', [CenterDetailController::class, 'banpong']);
Route::get('/center-detail/hemp', [CenterDetailController::class, 'hemp']);

Route::get('/center/lanna', [LannaController::class, 'index']);
Route::get('/center/royal', [AgricultureTheoryController::class, 'index']);
Route::get('/center/farm', [FarmController::class, 'index']);
Route::get('/center/banpong', [BanpongController::class, 'index']);
Route::get('/center/hemp', [CenterHempController::class, 'index']);
Route::get('/map/{centerId}/activities/{id}', [PublicActivityController::class, 'show']);

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware('auth')->group(function () {
    Route::get('/service/products', [ShopController::class, 'products']);
    Route::post('/orders', [MjuOrderController::class, 'store']);
    Route::post('/orders/{id}/upload-slip', [MjuOrderController::class, 'uploadSlip']);
    Route::get('/orders', [MjuOrderController::class, 'index']);

    Route::get('/service/booking', [BookingController::class, 'index']);
    Route::post('/service/booking', [BookingController::class, 'store']);
    Route::post('/service/booking/{id}/status', [BookingController::class, 'updateStatus']);

    Route::get('/service/history', [BookingController::class, 'history'])->name('service.history');

    Route::post('/notifications/mark-as-read', function () {
        auth()->user()->unreadNotifications->markAsRead();
        return back();
    })->name('notifications.markAsRead');
});

Route::middleware(['auth', 'role:admin|superadmin'])->group(function () {
    Route::get('/booking-calendar', [\App\Http\Controllers\SuperAdmin\BookingController::class, 'calendar']);
    Route::post('/booking-calendar/toggle-block', [\App\Http\Controllers\SuperAdmin\BookingController::class, 'toggleBlockDate']);
});

Route::middleware(['auth','role:admin|superadmin'])
    ->prefix('admin')
    ->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/create', [ProductController::class, 'create']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::get('/products/{id}/edit', [ProductController::class, 'edit']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    Route::get('/orders', [MjuOrderController::class, 'adminIndex']);
    Route::post('/orders/{id}/ship', [MjuOrderController::class, 'markShipped']);
    Route::post('/orders/{id}/tracking', [OrderSlipController::class, 'updateTracking']);
    Route::post('/orders/{id}/approve', [MjuOrderController::class, 'approvePayment']);

    Route::get('/booking', [SuperAdminBookingController::class, 'index']);
    Route::post('/booking/{id}/status', [SuperAdminBookingController::class, 'updateStatus']);
    Route::get('/booking/{id}/edit', [SuperAdminBookingController::class, 'edit']);
    Route::put('/booking/{id}', [SuperAdminBookingController::class, 'update']);
    Route::delete('/booking/{id}', [SuperAdminBookingController::class, 'destroy']);

    // เพิ่มบรรทัดนี้ลงไป เพื่อให้ Admin สามารถจัดการโปรโมชั่นได้
    Route::resource('promotions', PromotionController::class)->except(['create', 'edit', 'show']);
});

Route::middleware(['auth','role:superadmin'])
    ->prefix('superadmin')
    ->name('superadmin.')
    ->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/home', fn () => Inertia::render('SuperAdmin/HomeManager'))->name('home');

    Route::get('/centers/{type}/edit', [CenterAdminController::class, 'edit'])->name('centers.edit');
    Route::post('/centers/{type}/update-detail', [CenterAdminController::class, 'updateDetail'])->name('centers.update');
    Route::get('/centers-hub', fn () => Inertia::render('SuperAdmin/CenterHub'))->name('centers-hub');

    Route::post('/centers/{type}/history', [CenterAdminController::class, 'storeHistory'])->name('history.store');
    Route::post('/centers/{type}/history/{id}', [CenterAdminController::class, 'updateHistory'])->name('history.update');
    Route::delete('/centers/{type}/history/{id}', [CenterAdminController::class, 'destroyHistory'])->name('history.destroy');

    Route::get('/history', [SuperAdminHistoryController::class, 'index']);
    Route::post('/history', [SuperAdminHistoryController::class, 'store']);
    Route::put('/history/{id}', [SuperAdminHistoryController::class, 'update']);
    Route::delete('/history/{id}', [SuperAdminHistoryController::class, 'destroy']);

    Route::get('/home/slides', [SlideController::class, 'index']);
    Route::post('/home/slides', [SlideController::class, 'store']);
    Route::delete('/home/slides/{id}', [SlideController::class, 'destroy']);

    Route::get('/home/videos', [VideoController::class, 'index']);
    Route::post('/home/videos', [VideoController::class, 'store']);
    Route::delete('/home/videos/{id}', [VideoController::class, 'destroy']);

    Route::get('/pr', [PrController::class, 'index']);
    Route::post('/pr', [PrController::class, 'store']);
    Route::put('/pr/{id}', [PrController::class, 'update']);
    Route::delete('/pr/{id}', [PrController::class, 'destroy']);

    Route::get('/activity-news', [ActivityNewsController::class, 'index']);
    Route::post('/activity-news', [ActivityNewsController::class, 'store']);
    Route::put('/activity-news/{id}', [ActivityNewsController::class, 'update']);
    Route::delete('/activity-news/{id}', [ActivityNewsController::class, 'destroy']);

    Route::get('/articles-manager', [ArticleController::class, 'index']);
    Route::post('/articles-manager', [ArticleController::class, 'store']);
    Route::put('/articles-manager/{id}', [ArticleController::class, 'update']);
    Route::delete('/articles-manager/{id}', [ArticleController::class, 'destroy']);

    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::post('/users/{id}/role', [UserController::class, 'updateRole']);

    Route::get('/map', fn () => Inertia::render('SuperAdmin/MapCenterSelect'))->name('map-center.index');
    Route::get('/map/{centerId}', [MapController::class, 'editor']);
    Route::post('/map-marker', [MapController::class, 'store']);
    Route::put('/map-marker/{id}', [MapController::class, 'update']);
    Route::delete('/map-marker/{id}', [MapController::class, 'destroy']);

    Route::post('/activity/{centerId}', [SuperAdminActivityController::class, 'store']);
    Route::get('/map/{centerId}/activities/{id}', [SuperAdminActivityController::class, 'show']);

    Route::get('/personnel', [PersonnelController::class, 'index']);
    Route::post('/personnel', [PersonnelController::class, 'store']);
    Route::put('/personnel/{id}', [PersonnelController::class, 'update']);
    Route::delete('/personnel/{id}', [PersonnelController::class, 'destroy']);

    Route::get('/vision', [VisionController::class, 'index']);
    Route::post('/vision', [VisionController::class, 'store']);
    Route::put('/vision/{id}', [VisionController::class, 'update']);
    Route::delete('/vision/{id}', [VisionController::class, 'destroy']);

    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/create', [ProductController::class, 'create']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::get('/products/{id}/edit', [ProductController::class, 'edit']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    Route::get('/orders', [MjuOrderController::class, 'adminIndex']);
    Route::post('/orders/{id}/ship', [MjuOrderController::class, 'markShipped']);
    Route::post('/orders/{id}/tracking', [OrderSlipController::class, 'updateTracking']);
    Route::post('/orders/{id}/approve', [MjuOrderController::class, 'approvePayment']);

    Route::get('/booking', [SuperAdminBookingController::class, 'index']);
    Route::post('/booking/{id}/status', [SuperAdminBookingController::class, 'updateStatus']);
    Route::get('/booking/{id}/edit', [SuperAdminBookingController::class, 'edit']);
    Route::put('/booking/{id}', [SuperAdminBookingController::class, 'update']);
    Route::delete('/booking/{id}', [SuperAdminBookingController::class, 'destroy']);

    Route::get('/plot-fees', [PlotFeeController::class, 'index']);
    Route::post('/plot-fees', [PlotFeeController::class, 'store']);
    Route::put('/plot-fees/{id}', [PlotFeeController::class, 'update']);
    Route::delete('/plot-fees/{id}', [PlotFeeController::class, 'destroy']);

    Route::get('/order-slips', [OrderSlipController::class, 'index']);

    Route::resource('promotions', PromotionController::class)->except(['create', 'edit', 'show']);
});

Route::get('/api/preview-videos', [PreviewVideoController::class, 'index']);

Route::get('/dashboard', function () {
    if (auth()->check()) {
        if (auth()->user()->hasRole('superadmin')) {
            return redirect('/superadmin/dashboard');
        }
        if (auth()->user()->hasRole('admin')) {
            return redirect('/admin/dashboard');
        }
    }
    return redirect('/login');
});

Route::post('/api/calculate-shipping', function (\Illuminate\Http\Request $request) {
    $totalWeight = 0;

    foreach ($request->items as $item) {
        $product = DB::table('mju_shop_products')
            ->where('id', $item['id'])
            ->first();

        if ($product) {
            $totalWeight += ($product->weight ?? 1) * $item['qty'];
        }
    }

    $rate = DB::table('mju_shipping_rates')
        ->where('weight_min', '<=', $totalWeight)
        ->where('weight_max', '>=', $totalWeight)
        ->first();

    return response()->json([
        'shipping_fee' => (float) ($rate ? $rate->price : 40)
    ]);
});

require __DIR__.'/auth.php';
