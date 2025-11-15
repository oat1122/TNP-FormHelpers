<?php

namespace App\Providers;

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
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
