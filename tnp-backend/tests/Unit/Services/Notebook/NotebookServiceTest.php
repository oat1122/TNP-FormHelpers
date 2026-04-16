<?php

namespace Tests\Unit\Services\Notebook;

use App\Models\Notebook;
use App\Models\User\User;
use App\Services\Notebook\NotebookService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotebookServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::disableForeignKeyConstraints();
        $this->ensureUsersTable();
        $this->ensureMasterSubRolesTable();
        $this->ensureUserSubRolesTable();
        $this->ensureMasterCustomersTable();
        $this->ensureNotebooksTable();
        $this->ensureNotebookHistoriesTable();
        Schema::enableForeignKeyConstraints();

        DB::table('notebook_histories')->delete();
        DB::table('notebooks')->delete();
        DB::table('master_customers')->delete();
        DB::table('user_sub_roles')->delete();
        DB::table('master_sub_roles')->delete();
    }

    private function ensureUsersTable(): void
    {
        if (Schema::hasTable('users')) {
            return;
        }

        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('user_id');
            $table->uuid('user_uuid')->nullable();
            $table->string('username');
            $table->string('password');
            $table->string('role');
            $table->string('user_emp_no')->nullable();
            $table->string('user_firstname')->nullable();
            $table->string('user_lastname')->nullable();
            $table->string('user_phone')->nullable();
            $table->string('user_nickname')->nullable();
            $table->string('user_position')->nullable();
            $table->string('enable')->default('Y');
            $table->boolean('user_is_enable')->default(true);
            $table->integer('deleted')->default(0);
            $table->boolean('user_is_deleted')->default(false);
            $table->timestamps();
            $table->string('new_pass')->nullable();
            $table->boolean('pass_is_updated')->nullable()->default(false);
            $table->timestamp('user_created_date')->nullable();
            $table->unsignedBigInteger('user_created_by')->nullable();
            $table->timestamp('user_updated_date')->nullable();
            $table->unsignedBigInteger('user_updated_by')->nullable();
        });
    }

    private function ensureMasterSubRolesTable(): void
    {
        if (Schema::hasTable('master_sub_roles')) {
            return;
        }

        Schema::create('master_sub_roles', function (Blueprint $table) {
            $table->char('msr_id', 36)->primary();
            $table->string('msr_code')->unique();
            $table->string('msr_name');
            $table->string('msr_description')->nullable();
            $table->boolean('msr_is_active')->default(true);
            $table->integer('msr_sort')->default(0);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });
    }

    private function ensureUserSubRolesTable(): void
    {
        if (Schema::hasTable('user_sub_roles')) {
            return;
        }

        Schema::create('user_sub_roles', function (Blueprint $table) {
            $table->char('usr_id', 36)->primary();
            $table->unsignedBigInteger('usr_user_id');
            $table->char('usr_sub_role_id', 36);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamp('created_at')->nullable();
        });
    }

    private function ensureMasterCustomersTable(): void
    {
        if (Schema::hasTable('master_customers')) {
            return;
        }

        Schema::create('master_customers', function (Blueprint $table) {
            $table->char('cus_id', 36)->primary();
            $table->integer('cus_channel')->nullable();
            $table->string('cus_company')->nullable();
            $table->string('cus_firstname')->nullable();
            $table->string('cus_lastname')->nullable();
            $table->string('cus_name')->nullable();
            $table->string('cus_tel_1')->nullable();
            $table->string('cus_email')->nullable();
            $table->unsignedBigInteger('cus_manage_by')->nullable();
            $table->boolean('cus_is_use')->default(true);
            $table->timestamp('cus_created_date')->nullable();
            $table->unsignedBigInteger('cus_created_by')->nullable();
            $table->timestamp('cus_updated_date')->nullable();
            $table->unsignedBigInteger('cus_updated_by')->nullable();
        });
    }

    private function ensureNotebooksTable(): void
    {
        if (! Schema::hasTable('notebooks')) {
            Schema::create('notebooks', function (Blueprint $table) {
                $table->id();
                $table->date('nb_date')->nullable();
                $table->string('nb_time')->nullable();
                $table->string('nb_customer_name')->nullable();
                $table->boolean('nb_is_online')->default(false);
                $table->text('nb_additional_info')->nullable();
                $table->string('nb_contact_number')->nullable();
                $table->string('nb_email')->nullable();
                $table->string('nb_contact_person')->nullable();
                $table->string('nb_action')->nullable();
                $table->string('nb_status')->nullable();
                $table->text('nb_remarks')->nullable();
                $table->integer('nb_manage_by')->nullable();
                $table->string('nb_workflow')->default(Notebook::WORKFLOW_STANDARD);
                $table->string('nb_entry_type')->default(Notebook::ENTRY_TYPE_STANDARD);
                $table->string('nb_source_type')->nullable();
                $table->char('nb_source_customer_id', 36)->nullable();
                $table->unsignedBigInteger('nb_source_notebook_id')->nullable();
                $table->json('nb_lead_payload')->nullable();
                $table->timestamp('nb_claimed_at')->nullable();
                $table->timestamp('nb_converted_at')->nullable();
                $table->char('nb_converted_customer_id', 36)->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();
            });

            return;
        }

        Schema::table('notebooks', function (Blueprint $table) {
            if (! Schema::hasColumn('notebooks', 'nb_entry_type')) {
                $table->string('nb_entry_type')->default(Notebook::ENTRY_TYPE_STANDARD);
            }
            if (! Schema::hasColumn('notebooks', 'nb_source_type')) {
                $table->string('nb_source_type')->nullable();
            }
            if (! Schema::hasColumn('notebooks', 'nb_source_customer_id')) {
                $table->char('nb_source_customer_id', 36)->nullable();
            }
            if (! Schema::hasColumn('notebooks', 'nb_source_notebook_id')) {
                $table->unsignedBigInteger('nb_source_notebook_id')->nullable();
            }
        });
    }

    private function ensureNotebookHistoriesTable(): void
    {
        if (Schema::hasTable('notebook_histories')) {
            return;
        }

        Schema::create('notebook_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('notebook_id');
            $table->string('action');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->unsignedBigInteger('action_by')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();
        });
    }

    public function test_create_assigns_non_admin_notebook_to_self(): void
    {
        $salesUser = User::factory()->sales()->create();
        $manager = User::factory()->manager()->create();

        $notebook = app(NotebookService::class)->create([
            'nb_customer_name' => 'Service Notebook',
            'nb_manage_by' => $manager->user_id,
        ], $salesUser);

        $this->assertSame($salesUser->user_id, $notebook->nb_manage_by);
        $this->assertSame($salesUser->user_id, $notebook->created_by);
        $this->assertSame($salesUser->user_id, $notebook->updated_by);
        $this->assertSame(Notebook::ENTRY_TYPE_STANDARD, $notebook->nb_entry_type);
    }

    public function test_manager_can_reassign_notebook_owner_on_update(): void
    {
        $manager = User::factory()->manager()->create();
        $owner = User::factory()->sales()->create();
        $newOwner = User::factory()->sales()->create();

        $notebook = $this->createNotebook($owner, [
            'nb_customer_name' => 'Service Notebook',
        ]);

        $updated = app(NotebookService::class)->update((string) $notebook->id, [
            'nb_manage_by' => $newOwner->user_id,
        ], $manager);

        $this->assertSame($newOwner->user_id, $updated->nb_manage_by);
        $this->assertSame($manager->user_id, $updated->updated_by);
    }

    public function test_support_sales_subrole_creates_lead_into_central_queue(): void
    {
        $supportUser = User::factory()->create(['role' => 'production']);
        $this->attachSubRole($supportUser, 'SUPPORT_SALES');

        $notebook = app(NotebookService::class)->createLead([
            'cus_name' => 'Queue Lead',
            'cus_firstname' => 'Queue',
            'cus_lastname' => 'Lead',
            'cus_tel_1' => '0812345678',
            'cus_company' => 'Queue Co',
        ], $supportUser);

        $this->assertSame(Notebook::WORKFLOW_LEAD_QUEUE, $notebook->nb_workflow);
        $this->assertSame(Notebook::ENTRY_TYPE_STANDARD, $notebook->nb_entry_type);
        $this->assertNull($notebook->nb_manage_by);
        $this->assertSame($supportUser->user_id, $notebook->created_by);
    }

    public function test_sales_create_lead_into_their_own_notebook_list(): void
    {
        $salesUser = User::factory()->sales()->create();

        $notebook = app(NotebookService::class)->createLead([
            'cus_name' => 'Sales Lead',
            'cus_firstname' => 'Sales',
            'cus_lastname' => 'Lead',
            'cus_tel_1' => '0899999999',
            'cus_company' => 'Mine Co',
        ], $salesUser);

        $this->assertSame(Notebook::WORKFLOW_STANDARD, $notebook->nb_workflow);
        $this->assertSame(Notebook::ENTRY_TYPE_STANDARD, $notebook->nb_entry_type);
        $this->assertSame($salesUser->user_id, $notebook->nb_manage_by);
        $this->assertSame($salesUser->user_id, $notebook->created_by);
    }

    public function test_support_sales_subrole_can_create_lead_into_their_own_notebook_list(): void
    {
        $supportUser = User::factory()->create(['role' => 'production']);
        $this->attachSubRole($supportUser, 'SUPPORT_SALES');

        $notebook = app(NotebookService::class)->createLead([
            'target_scope' => 'mine',
            'cus_name' => 'Support Lead',
            'cus_firstname' => 'Support',
            'cus_lastname' => 'Lead',
            'cus_tel_1' => '0822222222',
            'cus_company' => 'Support Mine Co',
        ], $supportUser);

        $this->assertSame(Notebook::WORKFLOW_STANDARD, $notebook->nb_workflow);
        $this->assertSame(Notebook::ENTRY_TYPE_STANDARD, $notebook->nb_entry_type);
        $this->assertSame($supportUser->user_id, $notebook->nb_manage_by);
        $this->assertSame($supportUser->user_id, $notebook->created_by);
        $this->assertNotNull($notebook->nb_claimed_at);
    }

    public function test_sales_can_reserve_queue_lead(): void
    {
        $supportUser = User::factory()->create(['role' => 'production']);
        $this->attachSubRole($supportUser, 'SUPPORT_SALES');
        $salesUser = User::factory()->sales()->create();

        $notebook = app(NotebookService::class)->createLead([
            'cus_name' => 'Reserve Lead',
            'cus_firstname' => 'Reserve',
            'cus_lastname' => 'Lead',
            'cus_tel_1' => '0811111111',
            'cus_company' => 'Reserve Co',
        ], $supportUser);

        $reservedNotebook = app(NotebookService::class)->reserve((string) $notebook->id, $salesUser);

        $this->assertSame($salesUser->user_id, $reservedNotebook->nb_manage_by);
        $this->assertNotNull($reservedNotebook->nb_claimed_at);
    }

    public function test_create_customer_care_from_customer_source_hydrates_snapshot(): void
    {
        $salesUser = User::factory()->sales()->create();
        $customerId = $this->createCustomer($salesUser, [
            'cus_company' => 'Hydrated Customer',
            'cus_firstname' => 'Jane',
            'cus_lastname' => 'Smith',
            'cus_name' => 'Jane Smith',
            'cus_tel_1' => '0812222222',
            'cus_email' => 'jane@customer.test',
            'cus_channel' => 2,
        ]);

        $notebook = app(NotebookService::class)->createCustomerCare([
            'nb_date' => '2026-04-02',
            'nb_additional_info' => 'Care note',
            'source_type' => Notebook::SOURCE_TYPE_CUSTOMER,
            'source_customer_id' => $customerId,
        ], $salesUser);

        $this->assertSame(Notebook::ENTRY_TYPE_CUSTOMER_CARE, $notebook->nb_entry_type);
        $this->assertSame(Notebook::SOURCE_TYPE_CUSTOMER, $notebook->nb_source_type);
        $this->assertSame($customerId, $notebook->nb_source_customer_id);
        $this->assertSame('Hydrated Customer', $notebook->nb_customer_name);
        $this->assertSame('Jane Smith', $notebook->nb_contact_person);
        $this->assertSame('0812222222', $notebook->nb_contact_number);
        $this->assertSame('jane@customer.test', $notebook->nb_email);
        $this->assertTrue((bool) $notebook->nb_is_online);
    }

    public function test_create_customer_care_from_notebook_source_hydrates_snapshot(): void
    {
        $salesUser = User::factory()->sales()->create();
        $sourceNotebook = $this->createNotebook($salesUser, [
            'nb_customer_name' => 'Notebook Snapshot',
            'nb_contact_person' => 'Snapshot Person',
            'nb_contact_number' => '0823333333',
            'nb_email' => 'snapshot@notebook.test',
            'nb_is_online' => true,
        ]);

        $notebook = app(NotebookService::class)->createCustomerCare([
            'nb_date' => '2026-04-02',
            'source_type' => Notebook::SOURCE_TYPE_NOTEBOOK,
            'source_notebook_id' => $sourceNotebook->id,
        ], $salesUser);

        $this->assertSame(Notebook::ENTRY_TYPE_CUSTOMER_CARE, $notebook->nb_entry_type);
        $this->assertSame(Notebook::SOURCE_TYPE_NOTEBOOK, $notebook->nb_source_type);
        $this->assertSame($sourceNotebook->id, $notebook->nb_source_notebook_id);
        $this->assertSame('Notebook Snapshot', $notebook->nb_customer_name);
        $this->assertSame('Snapshot Person', $notebook->nb_contact_person);
        $this->assertSame('0823333333', $notebook->nb_contact_number);
        $this->assertSame('snapshot@notebook.test', $notebook->nb_email);
        $this->assertTrue((bool) $notebook->nb_is_online);
    }

    public function test_create_customer_care_rejects_unowned_customer_source(): void
    {
        $salesUser = User::factory()->sales()->create();
        $otherSalesUser = User::factory()->sales()->create();
        $customerId = $this->createCustomer($otherSalesUser);

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Selected customer source is not available.');

        app(NotebookService::class)->createCustomerCare([
            'nb_date' => '2026-04-02',
            'source_type' => Notebook::SOURCE_TYPE_CUSTOMER,
            'source_customer_id' => $customerId,
        ], $salesUser);
    }

    public function test_create_customer_care_rejects_customer_care_notebook_source(): void
    {
        $salesUser = User::factory()->sales()->create();
        $customerCareSource = $this->createNotebook($salesUser, [
            'nb_entry_type' => Notebook::ENTRY_TYPE_CUSTOMER_CARE,
            'nb_source_type' => Notebook::SOURCE_TYPE_CUSTOMER,
            'nb_source_customer_id' => (string) Str::uuid(),
        ]);

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Selected notebook source is not available.');

        app(NotebookService::class)->createCustomerCare([
            'nb_date' => '2026-04-02',
            'source_type' => Notebook::SOURCE_TYPE_NOTEBOOK,
            'source_notebook_id' => $customerCareSource->id,
        ], $salesUser);
    }

    public function test_update_does_not_change_customer_care_source_fields(): void
    {
        $salesUser = User::factory()->sales()->create();
        $customerId = $this->createCustomer($salesUser);
        $customerCare = $this->createNotebook($salesUser, [
            'nb_entry_type' => Notebook::ENTRY_TYPE_CUSTOMER_CARE,
            'nb_source_type' => Notebook::SOURCE_TYPE_CUSTOMER,
            'nb_source_customer_id' => $customerId,
            'nb_source_notebook_id' => null,
        ]);

        $updated = app(NotebookService::class)->update((string) $customerCare->id, [
            'nb_status' => 'Updated',
            'nb_entry_type' => Notebook::ENTRY_TYPE_STANDARD,
            'nb_source_type' => Notebook::SOURCE_TYPE_NOTEBOOK,
            'nb_source_customer_id' => (string) Str::uuid(),
            'nb_source_notebook_id' => 999,
        ], $salesUser);

        $this->assertSame('Updated', $updated->nb_status);
        $this->assertSame(Notebook::ENTRY_TYPE_CUSTOMER_CARE, $updated->nb_entry_type);
        $this->assertSame(Notebook::SOURCE_TYPE_CUSTOMER, $updated->nb_source_type);
        $this->assertSame($customerId, $updated->nb_source_customer_id);
        $this->assertNull($updated->nb_source_notebook_id);
    }

    private function createNotebook(User $owner, array $overrides = []): Notebook
    {
        $notebook = new Notebook(array_merge([
            'nb_customer_name' => 'Notebook Test',
            'nb_manage_by' => $owner->user_id,
            'nb_entry_type' => Notebook::ENTRY_TYPE_STANDARD,
            'nb_workflow' => Notebook::WORKFLOW_STANDARD,
        ], $overrides));
        $notebook->created_by = $owner->user_id;
        $notebook->updated_by = $owner->user_id;
        $notebook->save();

        return $notebook->fresh();
    }

    private function createCustomer(User $owner, array $overrides = []): string
    {
        $customerId = $overrides['cus_id'] ?? (string) Str::uuid();

        DB::table('master_customers')->insert(array_merge([
            'cus_id' => $customerId,
            'cus_channel' => 1,
            'cus_company' => 'Customer Co',
            'cus_firstname' => 'John',
            'cus_lastname' => 'Smith',
            'cus_name' => 'John Smith',
            'cus_tel_1' => '0800000000',
            'cus_email' => 'customer@example.com',
            'cus_manage_by' => $owner->user_id,
            'cus_is_use' => true,
            'cus_created_date' => now(),
            'cus_created_by' => $owner->user_id,
            'cus_updated_date' => now(),
            'cus_updated_by' => $owner->user_id,
        ], $overrides));

        return $customerId;
    }

    private function attachSubRole(User $user, string $code): void
    {
        $subRoleId = (string) Str::uuid();

        DB::table('master_sub_roles')->insert([
            'msr_id' => $subRoleId,
            'msr_code' => $code,
            'msr_name' => $code,
            'msr_description' => null,
            'msr_is_active' => true,
            'msr_sort' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('user_sub_roles')->insert([
            'usr_id' => (string) Str::uuid(),
            'usr_user_id' => $user->user_id,
            'usr_sub_role_id' => $subRoleId,
            'created_by' => $user->user_id,
            'created_at' => now(),
        ]);

        $user->unsetRelation('subRoles');
    }
}
