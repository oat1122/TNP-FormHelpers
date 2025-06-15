<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MasterBusinessType;

class CheckBusinessTypes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check:business-types';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check if business types are seeded successfully';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $count = MasterBusinessType::count();
        $this->info("Total business types in database: {$count}");

        if ($count > 0) {
            $this->info("First 5 business types:");
            $types = MasterBusinessType::take(5)->get();
            foreach ($types as $type) {
                $this->info("- {$type->bt_name} (Sort: {$type->bt_sort})");
            }
        }
        
        return 0;
    }
}
