<?php

namespace App\Console\Commands\Accounting;

use Illuminate\Console\Command;
use App\Models\Accounting\Invoice;
use App\Services\Accounting\DocumentService;

class UpdateInvoicePaymentStatus extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'accounting:update-invoice-status 
                          {--dry-run : Display what would be updated without making changes}';

    /**
     * The console command description.
     */
    protected $description = 'Update payment status for invoices based on due dates and payment amounts';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        
        $this->info('Starting invoice payment status update...');
        
        if ($dryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
        }

        // Get invoices that need status updates
        $invoices = Invoice::where(function ($query) {
            $query->where('due_date', '<', now())
                  ->where('payment_status', '!=', 'paid')
                  ->where('payment_status', '!=', 'overdue');
        })->orWhere(function ($query) {
            $query->where('paid_amount', '>', 0)
                  ->where('payment_status', 'unpaid');
        })->get();

        $this->info("Found {$invoices->count()} invoices to update");

        $updated = 0;
        $overdue = 0;
        $partiallyPaid = 0;
        $paid = 0;

        foreach ($invoices as $invoice) {
            $oldStatus = $invoice->payment_status;
            
            // Update payment status logic
            $invoice->updatePaymentStatus();
            
            if (!$dryRun) {
                $invoice->save();
            }

            if ($invoice->payment_status !== $oldStatus) {
                $updated++;
                
                switch ($invoice->payment_status) {
                    case 'overdue':
                        $overdue++;
                        break;
                    case 'partially_paid':
                        $partiallyPaid++;
                        break;
                    case 'paid':
                        $paid++;
                        break;
                }

                $this->line("Invoice {$invoice->invoice_no}: {$oldStatus} → {$invoice->payment_status}");
            }
        }

        $this->info("Update completed!");
        $this->table(['Status', 'Count'], [
            ['Total Updated', $updated],
            ['Overdue', $overdue],
            ['Partially Paid', $partiallyPaid],
            ['Paid', $paid]
        ]);

        if ($dryRun) {
            $this->warn('This was a dry run. Run without --dry-run to apply changes.');
        }

        return Command::SUCCESS;
    }
}
