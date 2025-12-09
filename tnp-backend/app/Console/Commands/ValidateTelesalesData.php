<?php

namespace App\Console\Commands;

use App\Models\MasterCustomer;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ValidateTelesalesData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'validate:telesales-data {--fix : Automatically fix issues where possible}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Validate data integrity after telesales migration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting Telesales Data Validation...');
        $this->newLine();

        $issues = [];
        $warnings = [];

        // 1. Check for NULL cus_source
        $this->info('Checking for NULL cus_source...');
        $nullSourceCount = MasterCustomer::whereNull('cus_source')->count();
        
        if ($nullSourceCount > 0) {
            $issues[] = "Found {$nullSourceCount} customers with NULL cus_source";
            $this->error("   {$nullSourceCount} customers have NULL cus_source");
            
            if ($this->option('fix')) {
                MasterCustomer::whereNull('cus_source')->update(['cus_source' => 'sales']);
                $this->info("  Fixed: Set cus_source='sales' for {$nullSourceCount} customers");
            }
        } else {
            $this->info('  All customers have cus_source value');
        }

        // 2. Check for NULL cus_allocation_status
        $this->info(' Checking for NULL cus_allocation_status...');
        $nullAllocationCount = MasterCustomer::whereNull('cus_allocation_status')->count();
        
        if ($nullAllocationCount > 0) {
            $issues[] = "Found {$nullAllocationCount} customers with NULL cus_allocation_status";
            $this->error("   {$nullAllocationCount} customers have NULL cus_allocation_status");
            
            if ($this->option('fix')) {
                MasterCustomer::whereNull('cus_allocation_status')->update(['cus_allocation_status' => 'allocated']);
                $this->info("   Fixed: Set cus_allocation_status='allocated' for {$nullAllocationCount} customers");
            }
        } else {
            $this->info('   All customers have cus_allocation_status value');
        }

        // 3. Check for invalid cus_allocated_by
        $this->info(' Checking for invalid cus_allocated_by references...');
        $invalidAllocatedBy = DB::table('master_customers')
            ->leftJoin('users', 'master_customers.cus_allocated_by', '=', 'users.user_id')
            ->whereNotNull('master_customers.cus_allocated_by')
            ->whereNull('users.user_id')
            ->count();
        
        if ($invalidAllocatedBy > 0) {
            $warnings[] = "Found {$invalidAllocatedBy} customers with invalid cus_allocated_by";
            $this->warn("   {$invalidAllocatedBy} customers reference non-existent users in cus_allocated_by");
            
            if ($this->option('fix')) {
                DB::table('master_customers')
                    ->leftJoin('users', 'master_customers.cus_allocated_by', '=', 'users.user_id')
                    ->whereNotNull('master_customers.cus_allocated_by')
                    ->whereNull('users.user_id')
                    ->update(['master_customers.cus_allocated_by' => null, 'master_customers.cus_allocated_at' => null]);
                $this->info("   Fixed: Cleared invalid cus_allocated_by references");
            }
        } else {
            $this->info('   All cus_allocated_by references are valid');
        }

        // 4. Check allocation_status consistency
        $this->info(' Checking allocation_status consistency...');
        $poolWithManager = MasterCustomer::where('cus_allocation_status', 'pool')
            ->whereNotNull('cus_manage_by')
            ->count();
        
        if ($poolWithManager > 0) {
            $warnings[] = "Found {$poolWithManager} customers in pool but with cus_manage_by assigned";
            $this->warn("   {$poolWithManager} customers are in 'pool' but have cus_manage_by assigned (should be NULL)");
            
            if ($this->option('fix')) {
                MasterCustomer::where('cus_allocation_status', 'pool')
                    ->whereNotNull('cus_manage_by')
                    ->update(['cus_allocation_status' => 'allocated']);
                $this->info("   Fixed: Changed status to 'allocated' for customers with managers");
            }
        } else {
            $this->info('  Allocation status is consistent');
        }

        // 5. Statistics Summary
        $this->newLine();
        $this->info('Data Statistics:');
        
        $totalCustomers = MasterCustomer::count();
        $bySource = MasterCustomer::select('cus_source', DB::raw('count(*) as count'))
            ->groupBy('cus_source')
            ->get();
        
        $this->table(
            ['Source', 'Count', 'Percentage'],
            $bySource->map(function ($item) use ($totalCustomers) {
                return [
                    $item->cus_source,
                    $item->count,
                    number_format(($item->count / $totalCustomers) * 100, 2) . '%'
                ];
            })
        );

        $byStatus = MasterCustomer::select('cus_allocation_status', DB::raw('count(*) as count'))
            ->groupBy('cus_allocation_status')
            ->get();
        
        $this->table(
            ['Allocation Status', 'Count', 'Percentage'],
            $byStatus->map(function ($item) use ($totalCustomers) {
                return [
                    $item->cus_allocation_status,
                    $item->count,
                    number_format(($item->count / $totalCustomers) * 100, 2) . '%'
                ];
            })
        );

        // 6. Final Summary
        $this->newLine();
        if (empty($issues) && empty($warnings)) {
            $this->info(' Validation Complete: No issues found!');
        } else {
            if (!empty($issues)) {
                $this->error('❌ Critical Issues Found:');
                foreach ($issues as $issue) {
                    $this->line('   • ' . $issue);
                }
            }
            
            if (!empty($warnings)) {
                $this->warn(' Warnings:');
                foreach ($warnings as $warning) {
                    $this->line('   • ' . $warning);
                }
            }
            
            if (!$this->option('fix')) {
                $this->newLine();
                $this->info(' Tip: Run with --fix option to automatically fix issues');
                $this->line('   php artisan validate:telesales-data --fix');
            }
        }

        return empty($issues) ? 0 : 1;
    }
}
