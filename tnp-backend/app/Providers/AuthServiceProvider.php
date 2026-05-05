<?php

namespace App\Providers;

use App\Constants\UserRole;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        // Admin bypass — admin ผ่านทุก gate ของระบบ (Phase 3 D2-A)
        Gate::before(fn ($user) => isset($user->role) && $user->role === UserRole::ADMIN ? true : null);

        $this->defineQuotationGates();
        $this->defineInvoiceGates();
        $this->defineReceiptGates();
    }

    private function defineQuotationGates(): void
    {
        $managerOrSale = [UserRole::MANAGER, UserRole::SALE];

        Gate::define('quotation.create', fn ($u) => in_array($u->role, $managerOrSale, true));
        Gate::define('quotation.update', fn ($u) => in_array($u->role, $managerOrSale, true));
        Gate::define('quotation.approve', fn ($u) => $u->role === UserRole::MANAGER);
        Gate::define('quotation.reject', fn ($u) => $u->role === UserRole::MANAGER);
        Gate::define('quotation.markSent', fn ($u) => in_array($u->role, $managerOrSale, true));
        Gate::define('quotation.markCompleted', fn ($u) => in_array($u->role, $managerOrSale, true));
        Gate::define('quotation.sendEmail', fn ($u) => in_array($u->role, $managerOrSale, true));
        Gate::define('quotation.uploadEvidence', fn ($u) => in_array($u->role, $managerOrSale, true));
        Gate::define('quotation.uploadSampleImages', fn ($u) => in_array($u->role, $managerOrSale, true));
        Gate::define('quotation.uploadSignatures', fn ($u) => $u->role === UserRole::SALE);
        Gate::define('quotation.bulkAutofill', fn ($u) => in_array($u->role, $managerOrSale, true));
    }

    private function defineInvoiceGates(): void
    {
        $managerOrSale = [UserRole::MANAGER, UserRole::SALE];

        Gate::define('invoice.create', fn ($u) => in_array($u->role, $managerOrSale, true));
        Gate::define('invoice.update', fn ($u) => in_array($u->role, $managerOrSale, true));
        Gate::define('invoice.approve', fn ($u) => $u->role === UserRole::MANAGER);
        Gate::define('invoice.reject', fn ($u) => $u->role === UserRole::MANAGER);
        Gate::define('invoice.revertToDraft', fn ($u) => $u->role === UserRole::MANAGER);
        Gate::define('invoice.submitAfterDeposit', fn ($u) => in_array($u->role, $managerOrSale, true));
        Gate::define('invoice.uploadEvidence', fn ($u) => in_array($u->role, $managerOrSale, true));
        Gate::define('invoice.destroy', fn ($u) => $u->role === UserRole::MANAGER);
        Gate::define('invoice.recordPayment', fn ($u) => $u->role === UserRole::MANAGER);
        Gate::define('invoice.sendReminder', fn ($u) => in_array($u->role, $managerOrSale, true));
        Gate::define('invoice.sendToCustomer', fn ($u) => in_array($u->role, $managerOrSale, true));
    }

    private function defineReceiptGates(): void
    {
        // Note: ก่อนหน้านี้ controller ใช้ ['admin', 'account'] แต่ 'account' ไม่อยู่ใน enum
        // (silent broken). Phase 3 D1: treat เป็น typo → ใช้ [admin, manager]
        Gate::define('receipt.create', fn ($u) => $u->role === UserRole::MANAGER);
        Gate::define('receipt.update', fn ($u) => $u->role === UserRole::MANAGER);
        Gate::define('receipt.approve', fn ($u) => $u->role === UserRole::MANAGER);
        Gate::define('receipt.reject', fn ($u) => $u->role === UserRole::MANAGER);
        Gate::define('receipt.uploadEvidence', fn ($u) => $u->role === UserRole::MANAGER);
        Gate::define('receipt.calculateVat', fn ($u) => in_array($u->role, [UserRole::MANAGER, UserRole::SALE], true));
    }
}
