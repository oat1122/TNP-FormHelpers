<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use App\Models\MasterCustomer;
use Illuminate\Support\Facades\Log;

class UpdateCustomerManageBy extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'customer:update-customer-manage-by';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'update cus_manage_by is null, when cd_last_datetime less than date now';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = Carbon::today();

        MasterCustomer::active()
        ->with('customerDetail')
        ->chunk(100, function ($customers) use ($today) { // Use chunk for performance
            foreach ($customers as $customer) {
                if ($customer->customerDetail 
                    && $customer->customerDetail->cd_last_datetime 
                    && $customer->customerDetail->cd_last_datetime->lt($today)
                    && $customer->cus_manage_by
                ) {
                    $customer->update([
                        'cus_manage_by' => null,
                        'cus_updated_by' => null,
                        'cus_updated_date' => Carbon::now(),
                    ]);

                    Log::info('Scheduled task daily UpdateCustomerManageBy:', [
                        'id' => $customer->cus_id,
                        'date today' => $today,
                        'cd_last_datetime' => $customer->customerDetail->cd_last_datetime,
                    ]);
                }
            }
        });
        $this->info('Scheduled task daily UpdateCustomerManageBy completed.');
    }
}
