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
        $this->defineDeliveryNoteGates();
    }

    private function defineQuotationGates(): void
    {
        // account = manager-tier (ยกเว้น admin-only) → ขยายทุก gate ที่เคยอนุญาต manager
        $accountingTeam = [UserRole::MANAGER, UserRole::ACCOUNT, UserRole::SALE];
        $managerOrAccount = [UserRole::MANAGER, UserRole::ACCOUNT];

        Gate::define('quotation.create', fn ($u) => in_array($u->role, $accountingTeam, true));
        Gate::define('quotation.update', fn ($u) => in_array($u->role, $accountingTeam, true));
        Gate::define('quotation.approve', fn ($u) => in_array($u->role, $managerOrAccount, true));
        Gate::define('quotation.reject', fn ($u) => in_array($u->role, $managerOrAccount, true));
        Gate::define('quotation.markSent', fn ($u) => in_array($u->role, $accountingTeam, true));
        Gate::define('quotation.markCompleted', fn ($u) => in_array($u->role, $accountingTeam, true));
        Gate::define('quotation.sendEmail', fn ($u) => in_array($u->role, $accountingTeam, true));
        Gate::define('quotation.uploadEvidence', fn ($u) => in_array($u->role, $accountingTeam, true));
        Gate::define('quotation.uploadSampleImages', fn ($u) => in_array($u->role, $accountingTeam, true));
        Gate::define('quotation.uploadSignatures', fn ($u) => in_array($u->role, [UserRole::SALE, UserRole::ACCOUNT], true));
        Gate::define('quotation.bulkAutofill', fn ($u) => in_array($u->role, $accountingTeam, true));
    }

    private function defineInvoiceGates(): void
    {
        $accountingTeam = [UserRole::MANAGER, UserRole::ACCOUNT, UserRole::SALE];
        $managerOrAccount = [UserRole::MANAGER, UserRole::ACCOUNT];

        Gate::define('invoice.create', fn ($u) => in_array($u->role, $accountingTeam, true));
        Gate::define('invoice.update', fn ($u) => in_array($u->role, $accountingTeam, true));
        Gate::define('invoice.approve', fn ($u) => in_array($u->role, $managerOrAccount, true));
        Gate::define('invoice.reject', fn ($u) => in_array($u->role, $managerOrAccount, true));
        Gate::define('invoice.revertToDraft', fn ($u) => in_array($u->role, $managerOrAccount, true));
        Gate::define('invoice.submitAfterDeposit', fn ($u) => in_array($u->role, $accountingTeam, true));
        Gate::define('invoice.uploadEvidence', fn ($u) => in_array($u->role, $accountingTeam, true));
        Gate::define('invoice.destroy', fn ($u) => in_array($u->role, $managerOrAccount, true));
        Gate::define('invoice.recordPayment', fn ($u) => in_array($u->role, $managerOrAccount, true));
        Gate::define('invoice.sendReminder', fn ($u) => in_array($u->role, $accountingTeam, true));
        Gate::define('invoice.sendToCustomer', fn ($u) => in_array($u->role, $accountingTeam, true));
    }

    private function defineReceiptGates(): void
    {
        $managerOrAccount = [UserRole::MANAGER, UserRole::ACCOUNT];

        Gate::define('receipt.create', fn ($u) => in_array($u->role, $managerOrAccount, true));
        Gate::define('receipt.update', fn ($u) => in_array($u->role, $managerOrAccount, true));
        Gate::define('receipt.approve', fn ($u) => in_array($u->role, $managerOrAccount, true));
        Gate::define('receipt.reject', fn ($u) => in_array($u->role, $managerOrAccount, true));
        Gate::define('receipt.uploadEvidence', fn ($u) => in_array($u->role, $managerOrAccount, true));
        Gate::define('receipt.calculateVat', fn ($u) => in_array($u->role, [UserRole::MANAGER, UserRole::ACCOUNT, UserRole::SALE], true));
    }

    private function defineDeliveryNoteGates(): void
    {
        // Production / fulfillment roles handle shipping; manager+account own admin lifecycle.
        $shippingTeam = [UserRole::MANAGER, UserRole::ACCOUNT, UserRole::PRODUCTION];
        $managerOrAccount = [UserRole::MANAGER, UserRole::ACCOUNT];

        Gate::define('delivery-note.create', fn ($u) => in_array($u->role, $managerOrAccount, true));
        Gate::define('delivery-note.update', fn ($u) => in_array($u->role, $managerOrAccount, true));
        Gate::define('delivery-note.destroy', fn ($u) => in_array($u->role, $managerOrAccount, true));
        Gate::define('delivery-note.createFromReceipt', fn ($u) => in_array($u->role, $managerOrAccount, true));
        Gate::define('delivery-note.startShipping', fn ($u) => in_array($u->role, $shippingTeam, true));
        Gate::define('delivery-note.updateTracking', fn ($u) => in_array($u->role, $shippingTeam, true));
        Gate::define('delivery-note.markDelivered', fn ($u) => in_array($u->role, $shippingTeam, true));
        Gate::define('delivery-note.markCompleted', fn ($u) => in_array($u->role, $managerOrAccount, true));
        Gate::define('delivery-note.markFailed', fn ($u) => in_array($u->role, $shippingTeam, true));
        Gate::define('delivery-note.uploadEvidence', fn ($u) => in_array($u->role, $shippingTeam, true));
    }
}
