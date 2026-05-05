<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Audit accounting tables for orphan foreign-key references that would block
 * the M9 enable-FK migration.
 *
 * Run before deploying the FK migration in production:
 *   php artisan accounting:audit-fk-orphans
 *
 * The migration uses `set null` semantics, so any orphans found here will be
 * silently NULL-ed when the migration runs. If that is unacceptable, run the
 * cleanup queries printed at the end of this command BEFORE the migration.
 */
class AuditAccountingFkOrphans extends Command
{
    protected $signature = 'accounting:audit-fk-orphans';

    protected $description = 'Count orphan FK references in accounting tables (M9 audit).';

    /**
     * Each entry: [child_table, fk_column, parent_table, parent_pk]
     *
     * @var array<int, array{0:string,1:string,2:string,3:string}>
     */
    private array $links = [
        ['quotations', 'customer_id', 'master_customers', 'cus_id'],
        ['quotations', 'primary_pricing_request_id', 'pricing_requests', 'pr_id'],
        ['invoices', 'quotation_id', 'quotations', 'id'],
        ['invoices', 'customer_id', 'master_customers', 'cus_id'],
        ['receipts', 'invoice_id', 'invoices', 'id'],
        ['receipts', 'customer_id', 'master_customers', 'cus_id'],
    ];

    public function handle(): int
    {
        $this->info('M9 — Accounting FK orphan audit');
        $this->line(str_repeat('=', 60));

        $totalOrphans = 0;
        $cleanupHints = [];

        foreach ($this->links as [$child, $fk, $parent, $pk]) {
            if (! Schema::hasTable($child)) {
                $this->warn("⏭  skip {$child}.{$fk} → table {$child} not present");

                continue;
            }
            if (! Schema::hasTable($parent)) {
                $this->warn("⏭  skip {$child}.{$fk} → parent {$parent} not present");

                continue;
            }
            if (! Schema::hasColumn($child, $fk)) {
                $this->warn("⏭  skip {$child}.{$fk} → column not present");

                continue;
            }

            $count = DB::table($child)
                ->whereNotNull($fk)
                ->whereNotIn($fk, function ($q) use ($parent, $pk) {
                    $q->select($pk)->from($parent);
                })
                ->count();

            if ($count > 0) {
                $totalOrphans += $count;
                $this->error(sprintf('✗ %s.%s → %s.%s : %d orphan(s)', $child, $fk, $parent, $pk, $count));

                $cleanupHints[] = sprintf(
                    'UPDATE %s SET %s = NULL WHERE %s IS NOT NULL AND %s NOT IN (SELECT %s FROM %s);',
                    $child,
                    $fk,
                    $fk,
                    $fk,
                    $pk,
                    $parent
                );
            } else {
                $this->info(sprintf('✓ %s.%s → %s.%s : 0 orphans', $child, $fk, $parent, $pk));
            }
        }

        $this->line(str_repeat('=', 60));

        if ($totalOrphans === 0) {
            $this->info('All clear. The M9 FK migration is safe to run.');

            return self::SUCCESS;
        }

        $this->warn("Total orphans across accounting tables: {$totalOrphans}");
        $this->line('');
        $this->line('The M9 migration uses ON DELETE SET NULL, so these rows will');
        $this->line('have their FK column NULL-ed automatically. If that is not');
        $this->line('acceptable, run the following cleanup queries first:');
        $this->line('');
        foreach ($cleanupHints as $hint) {
            $this->line('  '.$hint);
        }

        return self::SUCCESS;
    }
}
