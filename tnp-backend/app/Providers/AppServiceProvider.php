<?php

namespace App\Providers;

use App\Repositories\NotificationRepositoryInterface;
use App\Repositories\NotificationRepository;
use App\Services\PdfImageOptimizer;
use Illuminate\Support\ServiceProvider;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register PdfImageOptimizer as singleton with ImageManager DI
        $this->app->singleton(PdfImageOptimizer::class, function ($app) {
            $imageManager = new ImageManager(new GdDriver());
            return new PdfImageOptimizer($imageManager);
        });

        // Register NotificationRepository
        $this->app->bind(
            NotificationRepositoryInterface::class,
            NotificationRepository::class
        );

        // Register KPI & Customer Repositories
        // (ย้ายมาไว้ที่นี่เพื่อให้ Production ที่มี config cache เก่าสามารถใช้งานได้
        //  เนื่องจาก AppServiceProvider อยู่ใน cached config ตั้งแต่แรก)
        $this->app->bind(
            \App\Repositories\KpiRepositoryInterface::class,
            \App\Repositories\KpiRepository::class
        );
        $this->app->bind(
            \App\Repositories\CustomerRepositoryInterface::class,
            \App\Repositories\CustomerRepository::class
        );
        $this->app->bind(
            \App\Repositories\NotebookRepositoryInterface::class,
            \App\Repositories\NotebookRepository::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Monitor slow queries (> 1 second) and log them
        \Illuminate\Support\Facades\DB::listen(function ($query) {
            if ($query->time > 1000) {
                \Illuminate\Support\Facades\Log::channel('slow_queries')->warning('Slow Query Detected', [
                    'sql' => $query->sql,
                    'bindings' => $query->bindings,
                    'time' => $query->time . 'ms',
                    'url' => request()->fullUrl(),
                ]);
            }
        });

        // Register Observers
        \App\Models\Notebook::observe(\App\Observers\NotebookObserver::class);
    }
}
