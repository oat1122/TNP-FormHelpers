<?php

namespace Tests\Feature\Api\V1\MaxSupply;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

/**
 * A trait to set up the test environment for MaxSupply tests.
 * Ensures the required database tables are created before running tests.
 */
trait MaxSupplyTestSetup
{
    /**
     * Set up the test environment.
     *
     * @return void
     */
    protected function setUpMaxSupplyTables(): void
    {
        // First, ensure we have a clean state
        $this->dropTablesIfExist(['new_worksheets', 'max_supplies', 'activity_logs']);

        // Run specific migrations for the required tables
        $this->runRequiredMigrations();
    }

    /**
     * Drop tables if they exist
     *
     * @param array $tables
     * @return void
     */
    private function dropTablesIfExist(array $tables): void
    {
        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                Schema::dropIfExists($table);
            }
        }
    }

    /**
     * Run the necessary migrations for MaxSupply tests
     *
     * @return void
     */
    private function runRequiredMigrations(): void
    {
        // The easiest way is to just run all migrations for the test
        Artisan::call('migrate:fresh', [
            '--seed' => false,
            '--force' => true,
        ]);

        // Let's make absolutely sure the new_worksheets table exists first
        if (!Schema::hasTable('new_worksheets')) {
            // If it's still missing, try to create it manually
            Artisan::call('migrate', [
                '--path' => 'database/migrations/2025_03_27_112631_create_new_worksheets_table.php',
                '--force' => true,
            ]);
        }
    }
}
