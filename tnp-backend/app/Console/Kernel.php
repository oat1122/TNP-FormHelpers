<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        $schedule->command('customer:update-customer-manage-by')->runInBackground();
        
        // PDF Cache Management - Clear expired cache every 6 hours
        $schedule->command('pdf:clear-expired')
                 ->everySixHours()
                 ->runInBackground()
                 ->withoutOverlapping()
                 ->onSuccess(function () {
                     \Log::info('PDF cache cleanup completed successfully');
                 })
                 ->onFailure(function () {
                     \Log::error('PDF cache cleanup failed');
                 });
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
