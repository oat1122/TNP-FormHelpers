<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MasterCustomer;
use App\Models\RecallStatusHistory;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TakeRecallSnapshot extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'recall:take-snapshot';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Take daily snapshots of customer recall statuses for historical tracking';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting recall status snapshot...');
        
        $today = Carbon::today()->format('Y-m-d');
        $now = Carbon::now();

        // 1. Delete existing snapshot for today to allow re-running without duplication
        RecallStatusHistory::where('snapshot_date', $today)->delete();

        // 2. Fetch all active customers with their details
        // We use chunking to avoid memory issues with thousands of records
        $count = 0;
        
        MasterCustomer::query()
            ->join('customer_details', 'master_customers.cus_id', '=', 'customer_details.cd_cus_id')
            ->where('master_customers.cus_is_use', true)
            ->where('customer_details.cd_is_use', true)
            ->select(
                'master_customers.cus_id',
                'master_customers.cus_name',
                'master_customers.cus_company',
                'master_customers.cus_firstname',
                'master_customers.cus_lastname',
                'master_customers.cus_mcg_id',
                'master_customers.cus_source',
                'master_customers.cus_manage_by',
                'customer_details.cd_last_datetime'
            )
            ->chunk(500, function ($customers) use ($today, $now, &$count) {
                $batch = [];
                
                foreach ($customers as $customer) {
                    // Determine Customer Display Name
                    $customerName = trim($customer->cus_firstname . ' ' . $customer->cus_lastname);
                    if (empty($customerName) && !empty($customer->cus_name)) {
                        $customerName = $customer->cus_name;
                    }
                    if (empty($customerName) && !empty($customer->cus_company)) {
                        $customerName = $customer->cus_company;
                    }

                    // Calculate Status & Overdue Days
                    $lastDatetime = $customer->cd_last_datetime ? Carbon::parse($customer->cd_last_datetime) : null;
                    
                    if ($lastDatetime && $lastDatetime->isPast()) {
                        $status = 'overdue';
                        $daysOverdue = (int) $lastDatetime->startOfDay()->diffInDays($now->copy()->startOfDay());
                    } else {
                        $status = 'in_criteria';
                        $daysOverdue = 0;
                    }

                    $batch[] = [
                        'id' => \Illuminate\Support\Str::uuid()->toString(),
                        'snapshot_date' => $today,
                        'customer_id' => $customer->cus_id,
                        'customer_name' => substr($customerName, 0, 255),
                        'customer_group_id' => $customer->cus_mcg_id,
                        'source' => $customer->cus_source,
                        'manage_by' => $customer->cus_manage_by,
                        'recall_status' => $status,
                        'cd_last_datetime' => $lastDatetime ? $lastDatetime->format('Y-m-d H:i:s') : null,
                        'days_overdue' => $daysOverdue,
                        'created_at' => $now->format('Y-m-d H:i:s')
                    ];
                }

                // Insert the batch
                RecallStatusHistory::insert($batch);
                $count += count($batch);
            });

        $this->info("Completed! Snapshot taken for {$count} active customers.");
        return Command::SUCCESS;
    }
}
