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
    }
}
