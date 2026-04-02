<?php

namespace Tests\Feature\Api\V1;

use App\Models\Notebook;
use App\Models\NotebookHistory;
use App\Models\User\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotebookControllerTest extends TestCase
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

    public function test_non_owner_cannot_view_another_users_notebook(): void
    {
        $owner = User::factory()->sales()->create();
        $intruder = User::factory()->sales()->create();
        $notebook = $this->createNotebook($owner);

        Sanctum::actingAs($intruder);

        $this->getJson("/api/v1/notebooks/{$notebook->id}")
            ->assertForbidden();
    }

    public function test_store_ignores_protected_fields_from_non_admin_payload(): void
    {
        $salesUser = User::factory()->sales()->create();
        $manager = User::factory()->manager()->create();

        Sanctum::actingAs($salesUser);

        $response = $this->postJson('/api/v1/notebooks', [
            'nb_customer_name' => 'Notebook Owner Test',
            'nb_manage_by' => $manager->user_id,
            'created_by' => $manager->user_id,
            'updated_by' => $manager->user_id,
            'nb_converted_at' => now()->toISOString(),
        ])->assertCreated();

        $notebookId = $response->json('id');

        $this->assertDatabaseHas('notebooks', [
            'id' => $notebookId,
            'nb_customer_name' => 'Notebook Owner Test',
            'nb_manage_by' => $salesUser->user_id,
            'created_by' => $salesUser->user_id,
            'updated_by' => $salesUser->user_id,
            'nb_entry_type' => Notebook::ENTRY_TYPE_STANDARD,
        ]);

        $this->assertDatabaseMissing('notebooks', [
            'id' => $notebookId,
            'nb_manage_by' => $manager->user_id,
        ]);
    }

    public function test_non_admin_update_cannot_reassign_notebook_owner(): void
    {
        $owner = User::factory()->sales()->create();
        $manager = User::factory()->manager()->create();
        $notebook = $this->createNotebook($owner);

        Sanctum::actingAs($owner);

        $this->putJson("/api/v1/notebooks/{$notebook->id}", [
            'nb_status' => 'Updated',
            'nb_manage_by' => $manager->user_id,
        ])->assertOk();

        $this->assertDatabaseHas('notebooks', [
            'id' => $notebook->id,
            'nb_manage_by' => $owner->user_id,
            'nb_status' => 'Updated',
        ]);
    }

    public function test_convert_endpoint_sets_conversion_timestamp_server_side(): void
    {
        $owner = User::factory()->sales()->create();
        $notebook = $this->createNotebook($owner);

        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/notebooks/{$notebook->id}/convert", [
            'nb_status' => 'Converted',
            'nb_converted_at' => '2000-01-01T00:00:00.000Z',
        ])->assertOk();

        $this->assertDatabaseHas('notebooks', [
            'id' => $notebook->id,
            'nb_status' => 'Converted',
        ]);

        $this->assertNotNull($notebook->fresh()->nb_converted_at);
    }

    public function test_index_can_return_unpaginated_export_results(): void
    {
        $owner = User::factory()->sales()->create();
        $this->createNotebook($owner, ['nb_customer_name' => 'Export 1']);
        $this->createNotebook($owner, ['nb_customer_name' => 'Export 2']);

        Sanctum::actingAs($owner);

        $response = $this->getJson('/api/v1/notebooks?paginate=false&include=histories')
            ->assertOk();

        $response->assertJsonCount(2);
        $this->assertIsArray($response->json());
    }

    public function test_index_filters_notebooks_by_selected_date_type(): void
    {
        $owner = User::factory()->sales()->create();

        $followUpNotebook = $this->createNotebook($owner, [
            'nb_customer_name' => 'Follow Up Match',
            'nb_date' => '2026-04-10',
        ]);
        $createdNotebook = $this->createNotebook($owner, [
            'nb_customer_name' => 'Created Match',
            'nb_date' => '2026-03-10',
        ]);
        $updatedNotebook = $this->createNotebook($owner, [
            'nb_customer_name' => 'Updated Match',
            'nb_date' => '2026-03-11',
        ]);
        $outOfRangeNotebook = $this->createNotebook($owner, [
            'nb_customer_name' => 'Out Of Range',
            'nb_date' => '2026-03-12',
        ]);

        $this->setNotebookDates($followUpNotebook, '2026-04-10', '2026-03-10 09:00:00', '2026-03-11 09:00:00');
        $this->setNotebookDates($createdNotebook, '2026-03-10', '2026-04-10 09:00:00', '2026-03-11 09:00:00');
        $this->setNotebookDates($updatedNotebook, '2026-03-11', '2026-03-12 09:00:00', '2026-04-10 09:00:00');
        $this->setNotebookDates($outOfRangeNotebook, '2026-03-12', '2026-03-13 09:00:00', '2026-03-14 09:00:00');

        Sanctum::actingAs($owner);

        $followUpResponse = $this->getJson('/api/v1/notebooks?start_date=2026-04-01&end_date=2026-04-30&date_filter_by=nb_date')->assertOk();
        $createdResponse = $this->getJson('/api/v1/notebooks?start_date=2026-04-01&end_date=2026-04-30&date_filter_by=created_at')->assertOk();
        $updatedResponse = $this->getJson('/api/v1/notebooks?start_date=2026-04-01&end_date=2026-04-30&date_filter_by=updated_at')->assertOk();
        $allResponse = $this->getJson('/api/v1/notebooks?start_date=2026-04-01&end_date=2026-04-30&date_filter_by=all')->assertOk();

        $followUpIds = collect($followUpResponse->json('data'))->pluck('id')->all();
        $createdIds = collect($createdResponse->json('data'))->pluck('id')->all();
        $updatedIds = collect($updatedResponse->json('data'))->pluck('id')->all();
        $allIds = collect($allResponse->json('data'))->pluck('id')->all();

        $this->assertSame([$followUpNotebook->id], $followUpIds);
        $this->assertSame([$createdNotebook->id], $createdIds);
        $this->assertSame([$updatedNotebook->id], $updatedIds);
        $this->assertEqualsCanonicalizing([$createdNotebook->id, $updatedNotebook->id], $allIds);
    }

    public function test_sales_can_create_customer_care_from_customer_source(): void
    {
        $salesUser = User::factory()->sales()->create();
        $customerId = $this->createCustomer($salesUser, [
            'cus_company' => 'Acme Co',
            'cus_firstname' => 'Jane',
            'cus_lastname' => 'Doe',
            'cus_name' => 'Jane Doe',
            'cus_tel_1' => '0812345678',
            'cus_email' => 'jane@example.com',
            'cus_channel' => 2,
        ]);

        Sanctum::actingAs($salesUser);

        $response = $this->postJson('/api/v1/notebooks/customer-care', [
            'nb_date' => '2026-04-02',
            'nb_additional_info' => 'Called customer',
            'nb_action' => 'Call',
            'nb_status' => 'In progress',
            'nb_remarks' => 'Follow up next week',
            'source_type' => Notebook::SOURCE_TYPE_CUSTOMER,
            'source_customer_id' => $customerId,
        ])->assertCreated();

        $notebookId = $response->json('id');

        $response
            ->assertJsonPath('nb_entry_type', Notebook::ENTRY_TYPE_CUSTOMER_CARE)
            ->assertJsonPath('nb_source_type', Notebook::SOURCE_TYPE_CUSTOMER)
            ->assertJsonPath('nb_source_customer_id', $customerId);

        $this->assertDatabaseHas('notebooks', [
            'id' => $notebookId,
            'nb_entry_type' => Notebook::ENTRY_TYPE_CUSTOMER_CARE,
            'nb_source_type' => Notebook::SOURCE_TYPE_CUSTOMER,
            'nb_source_customer_id' => $customerId,
            'nb_customer_name' => 'Acme Co',
            'nb_contact_person' => 'Jane Doe',
            'nb_contact_number' => '0812345678',
            'nb_email' => 'jane@example.com',
            'nb_is_online' => 1,
            'nb_manage_by' => $salesUser->user_id,
        ]);
    }

    public function test_sales_can_create_customer_care_from_owned_notebook_source(): void
    {
        $salesUser = User::factory()->sales()->create();
        $sourceNotebook = $this->createNotebook($salesUser, [
            'nb_customer_name' => 'Notebook Source',
            'nb_contact_person' => 'Source Person',
            'nb_contact_number' => '0890000000',
            'nb_email' => 'source@example.com',
            'nb_is_online' => true,
        ]);

        Sanctum::actingAs($salesUser);

        $response = $this->postJson('/api/v1/notebooks/customer-care', [
            'nb_date' => '2026-04-03',
            'nb_additional_info' => 'Notebook sourced care',
            'source_type' => Notebook::SOURCE_TYPE_NOTEBOOK,
            'source_notebook_id' => $sourceNotebook->id,
        ])->assertCreated();

        $notebookId = $response->json('id');

        $this->assertDatabaseHas('notebooks', [
            'id' => $notebookId,
            'nb_entry_type' => Notebook::ENTRY_TYPE_CUSTOMER_CARE,
            'nb_source_type' => Notebook::SOURCE_TYPE_NOTEBOOK,
            'nb_source_notebook_id' => $sourceNotebook->id,
            'nb_customer_name' => 'Notebook Source',
            'nb_contact_person' => 'Source Person',
            'nb_contact_number' => '0890000000',
            'nb_email' => 'source@example.com',
            'nb_is_online' => 1,
        ]);
    }

    public function test_non_sale_cannot_create_customer_care(): void
    {
        $manager = User::factory()->manager()->create();

        Sanctum::actingAs($manager);

        $this->postJson('/api/v1/notebooks/customer-care', [
            'nb_date' => '2026-04-02',
            'source_type' => Notebook::SOURCE_TYPE_CUSTOMER,
            'source_customer_id' => (string) Str::uuid(),
        ])->assertForbidden();
    }

    public function test_customer_care_customer_sources_only_return_owned_customers(): void
    {
        $salesUser = User::factory()->sales()->create();
        $otherSalesUser = User::factory()->sales()->create();

        $ownedCustomerId = $this->createCustomer($salesUser, [
            'cus_company' => 'Owned Customer',
        ]);
        $this->createCustomer($otherSalesUser, [
            'cus_company' => 'Other Customer',
        ]);

        Sanctum::actingAs($salesUser);

        $response = $this->getJson('/api/v1/notebooks/customer-care/sources?source=customer')
            ->assertOk();

        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.source_type', Notebook::SOURCE_TYPE_CUSTOMER);
        $response->assertJsonPath('data.0.source_customer_id', $ownedCustomerId);
        $response->assertJsonMissing(['label' => 'Other Customer']);
    }

    public function test_customer_care_notebook_sources_only_return_owned_standard_notebooks(): void
    {
        $salesUser = User::factory()->sales()->create();
        $otherSalesUser = User::factory()->sales()->create();

        $standardNotebook = $this->createNotebook($salesUser, [
            'nb_customer_name' => 'Owned Standard',
        ]);
        $this->createNotebook($salesUser, [
            'nb_customer_name' => 'Owned Customer Care',
            'nb_entry_type' => Notebook::ENTRY_TYPE_CUSTOMER_CARE,
            'nb_source_type' => Notebook::SOURCE_TYPE_CUSTOMER,
            'nb_source_customer_id' => (string) Str::uuid(),
        ]);
        $this->createNotebook($otherSalesUser, [
            'nb_customer_name' => 'Other Standard',
        ]);

        Sanctum::actingAs($salesUser);

        $response = $this->getJson('/api/v1/notebooks/customer-care/sources?source=notebook')
            ->assertOk();

        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.source_type', Notebook::SOURCE_TYPE_NOTEBOOK);
        $response->assertJsonPath('data.0.source_notebook_id', $standardNotebook->id);
        $response->assertJsonMissing(['label' => 'Owned Customer Care']);
        $response->assertJsonMissing(['label' => 'Other Standard']);
    }

    public function test_customer_care_update_ignores_locked_source_fields(): void
    {
        $salesUser = User::factory()->sales()->create();
        $customerId = $this->createCustomer($salesUser, [
            'cus_company' => 'Locked Source Customer',
        ]);
        $customerCare = $this->createNotebook($salesUser, [
            'nb_customer_name' => 'Locked Source Customer',
            'nb_entry_type' => Notebook::ENTRY_TYPE_CUSTOMER_CARE,
            'nb_source_type' => Notebook::SOURCE_TYPE_CUSTOMER,
            'nb_source_customer_id' => $customerId,
            'nb_source_notebook_id' => null,
        ]);

        Sanctum::actingAs($salesUser);

        $this->putJson("/api/v1/notebooks/{$customerCare->id}", [
            'nb_status' => 'Touched',
            'nb_entry_type' => Notebook::ENTRY_TYPE_STANDARD,
            'nb_source_type' => Notebook::SOURCE_TYPE_NOTEBOOK,
            'nb_source_customer_id' => (string) Str::uuid(),
            'nb_source_notebook_id' => 99999,
        ])->assertOk();

        $this->assertDatabaseHas('notebooks', [
            'id' => $customerCare->id,
            'nb_status' => 'Touched',
            'nb_entry_type' => Notebook::ENTRY_TYPE_CUSTOMER_CARE,
            'nb_source_type' => Notebook::SOURCE_TYPE_CUSTOMER,
            'nb_source_customer_id' => $customerId,
            'nb_source_notebook_id' => null,
        ]);
    }

    public function test_index_can_filter_customer_care_entry_type(): void
    {
        $salesUser = User::factory()->sales()->create();

        $customerCare = $this->createNotebook($salesUser, [
            'nb_customer_name' => 'Customer Care Entry',
            'nb_entry_type' => Notebook::ENTRY_TYPE_CUSTOMER_CARE,
        ]);
        $this->createNotebook($salesUser, [
            'nb_customer_name' => 'Standard Entry',
            'nb_entry_type' => Notebook::ENTRY_TYPE_STANDARD,
        ]);

        Sanctum::actingAs($salesUser);

        $response = $this->getJson('/api/v1/notebooks?entry_type=customer_care')
            ->assertOk();

        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $customerCare->id);
        $response->assertJsonPath('data.0.nb_entry_type', Notebook::ENTRY_TYPE_CUSTOMER_CARE);
    }

    public function test_standard_export_query_can_exclude_customer_care_entries(): void
    {
        $salesUser = User::factory()->sales()->create();

        $standardNotebook = $this->createNotebook($salesUser, [
            'nb_customer_name' => 'Standard Export Entry',
            'nb_entry_type' => Notebook::ENTRY_TYPE_STANDARD,
        ]);
        $this->createNotebook($salesUser, [
            'nb_customer_name' => 'Customer Care Export Entry',
            'nb_entry_type' => Notebook::ENTRY_TYPE_CUSTOMER_CARE,
        ]);

        Sanctum::actingAs($salesUser);

        $response = $this->getJson('/api/v1/notebooks?paginate=false&include=histories&entry_type=standard')
            ->assertOk();

        $response->assertJsonCount(1);
        $response->assertJsonPath('0.id', $standardNotebook->id);
        $response->assertJsonMissing(['nb_customer_name' => 'Customer Care Export Entry']);
    }

    public function test_sales_self_report_includes_customer_care_activity_items(): void
    {
        $salesUser = User::factory()->sales()->create();
        $customerId = $this->createCustomer($salesUser, [
            'cus_company' => 'Self Report Customer',
        ]);

        Sanctum::actingAs($salesUser);

        $this->postJson('/api/v1/notebooks/customer-care', [
            'nb_date' => now()->toDateString(),
            'nb_additional_info' => 'Self report item',
            'source_type' => Notebook::SOURCE_TYPE_CUSTOMER,
            'source_customer_id' => $customerId,
        ])->assertCreated();

        $response = $this->getJson(
            '/api/v1/notebooks/self-report?start_date='.now()->toDateString().'&end_date='.now()->toDateString()
        )->assertOk();

        $response->assertJsonCount(0, 'lead_additions');
        $response->assertJsonCount(1, 'activity_items');
        $response->assertJsonPath('activity_items.0.nb_entry_type', Notebook::ENTRY_TYPE_CUSTOMER_CARE);
    }

    public function test_support_sales_subrole_can_store_lead_into_queue_and_export_self_report(): void
    {
        $supportUser = User::factory()->create(['role' => 'production']);
        $this->attachSubRole($supportUser, 'SUPPORT_SALES');

        Sanctum::actingAs($supportUser);

        $response = $this->postJson('/api/v1/notebooks/leads', [
            'cus_name' => 'Queue Lead',
            'cus_firstname' => 'Queue',
            'cus_lastname' => 'Lead',
            'cus_tel_1' => '0812345678',
            'cus_company' => 'Queue Co',
            'cd_note' => 'Need callback',
        ])->assertCreated();

        $notebookId = $response->json('id');

        $this->assertDatabaseHas('notebooks', [
            'id' => $notebookId,
            'nb_customer_name' => 'Queue Co',
            'nb_workflow' => Notebook::WORKFLOW_LEAD_QUEUE,
            'nb_entry_type' => Notebook::ENTRY_TYPE_STANDARD,
            'nb_manage_by' => null,
            'created_by' => $supportUser->user_id,
        ]);

        $reportResponse = $this->getJson(
            '/api/v1/notebooks/self-report?start_date='.now()->toDateString().'&end_date='.now()->toDateString()
        )->assertOk();

        $reportResponse->assertJsonCount(1, 'lead_additions');
        $reportResponse->assertJsonCount(1, 'activity_items');
    }

    public function test_sales_can_reserve_queue_notebook_created_by_support_sales_subrole(): void
    {
        $supportUser = User::factory()->create(['role' => 'production']);
        $this->attachSubRole($supportUser, 'SUPPORT_SALES');
        $salesUser = User::factory()->sales()->create();

        $notebook = $this->createNotebook($supportUser, [
            'nb_customer_name' => 'Queue Reserve Test',
            'nb_manage_by' => null,
            'nb_workflow' => Notebook::WORKFLOW_LEAD_QUEUE,
            'nb_claimed_at' => null,
        ]);

        Sanctum::actingAs($salesUser);

        $this->postJson("/api/v1/notebooks/{$notebook->id}/reserve")
            ->assertOk()
            ->assertJsonPath('nb_manage_by', $salesUser->user_id);

        $this->assertDatabaseHas('notebooks', [
            'id' => $notebook->id,
            'nb_manage_by' => $salesUser->user_id,
            'nb_workflow' => Notebook::WORKFLOW_LEAD_QUEUE,
        ]);
    }

    public function test_manager_can_filter_index_by_action_and_manage_by(): void
    {
        $manager = User::factory()->manager()->create();
        $salesOwner = User::factory()->sales()->create();
        $otherSalesOwner = User::factory()->sales()->create();

        $matchingNotebook = $this->createNotebook($salesOwner, [
            'nb_customer_name' => 'Call Prospect',
            'nb_action' => 'Call',
            'nb_manage_by' => $salesOwner->user_id,
        ]);

        $this->createNotebook($salesOwner, [
            'nb_customer_name' => 'Meeting Prospect',
            'nb_action' => 'Meeting',
            'nb_manage_by' => $salesOwner->user_id,
        ]);

        $this->createNotebook($otherSalesOwner, [
            'nb_customer_name' => 'Other Sales Call',
            'nb_action' => 'Call',
            'nb_manage_by' => $otherSalesOwner->user_id,
        ]);

        Sanctum::actingAs($manager);

        $response = $this->getJson(sprintf(
            '/api/v1/notebooks?action=%s&manage_by=%s',
            urlencode('Call'),
            $salesOwner->user_id
        ))->assertOk();

        $response->assertJsonPath('total', 1);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $matchingNotebook->id);
        $response->assertJsonPath('data.0.nb_action', 'Call');
        $response->assertJsonPath('data.0.nb_manage_by', $salesOwner->user_id);
    }

    public function test_show_returns_histories_with_action_by_for_edit_dialog(): void
    {
        $owner = User::factory()->sales()->create([
            'username' => 'history-owner',
            'user_nickname' => 'Owner',
        ]);

        Sanctum::actingAs($owner);

        $createdResponse = $this->postJson('/api/v1/notebooks', [
            'nb_customer_name' => 'Notebook History Detail',
            'nb_additional_info' => null,
        ])->assertCreated();

        $notebookId = $createdResponse->json('id');

        $response = $this->getJson("/api/v1/notebooks/{$notebookId}")
            ->assertOk();

        $response->assertJsonPath('manage_by_user.user_id', $owner->user_id);
        $response->assertJsonPath('manage_by_user.username', 'history-owner');
        $response->assertJsonPath('histories.0.display_new_values.nb_manage_by', 'history-owner');
        $response->assertJsonPath('histories.0.action', 'created');
        $response->assertJsonPath('histories.0.action_by.user_id', $owner->user_id);
    }

    public function test_show_serializes_nb_date_as_plain_date_string(): void
    {
        $owner = User::factory()->sales()->create();
        $notebook = $this->createNotebook($owner, [
            'nb_date' => '2026-04-02',
        ]);

        Sanctum::actingAs($owner);

        $this->getJson("/api/v1/notebooks/{$notebook->id}")
            ->assertOk()
            ->assertJsonPath('nb_date', '2026-04-02');
    }

    public function test_created_history_keeps_nullable_additional_info_field_for_edit_dialog(): void
    {
        $owner = User::factory()->sales()->create();

        Sanctum::actingAs($owner);

        $createdResponse = $this->postJson('/api/v1/notebooks', [
            'nb_customer_name' => 'Notebook Blank Additional Info',
            'nb_additional_info' => null,
        ])->assertCreated();

        $notebookId = $createdResponse->json('id');

        $response = $this->getJson("/api/v1/notebooks/{$notebookId}")
            ->assertOk();

        $histories = $response->json('histories');

        $this->assertNotEmpty($histories);
        $this->assertArrayHasKey('nb_additional_info', $histories[0]['new_values']);
        $this->assertNull($histories[0]['new_values']['nb_additional_info']);
    }

    public function test_notebook_summary_requires_allowed_role(): void
    {
        $productionUser = User::factory()->create(['role' => 'production']);

        Sanctum::actingAs($productionUser);

        $this->getJson('/api/v1/customers/kpi/notebook-summary')
            ->assertForbidden();
    }

    public function test_notebook_summary_uses_source_filter_with_manage_by_fallback(): void
    {
        $manager = User::factory()->manager()->create();
        $salesUser = User::factory()->sales()->create([
            'user_firstname' => 'Sale',
            'user_lastname' => 'Owner',
        ]);
        $telesalesUser = User::factory()->create([
            'role' => 'telesale',
            'user_firstname' => 'Tele',
            'user_lastname' => 'Owner',
        ]);

        $salesNotebook = $this->createNotebook($salesUser, [
            'nb_customer_name' => 'Sales Notebook',
            'nb_manage_by' => null,
            'nb_is_online' => false,
        ]);
        $telesalesNotebook = $this->createNotebook($telesalesUser, [
            'nb_customer_name' => 'Telesales Notebook',
            'nb_manage_by' => $telesalesUser->user_id,
            'nb_is_online' => false,
        ]);

        NotebookHistory::create([
            'notebook_id' => $salesNotebook->id,
            'action' => 'created',
            'old_values' => null,
            'new_values' => ['nb_customer_name' => 'Sales Notebook'],
            'action_by' => $salesUser->user_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        NotebookHistory::create([
            'notebook_id' => $telesalesNotebook->id,
            'action' => 'created',
            'old_values' => null,
            'new_values' => ['nb_customer_name' => 'Telesales Notebook'],
            'action_by' => $telesalesUser->user_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($manager);

        $response = $this->getJson('/api/v1/customers/kpi/notebook-summary?period=month&source_filter=sales')
            ->assertOk();

        $response->assertJsonPath('status', 'success');
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.user_id', $salesUser->user_id);
        $response->assertJsonPath('data.0.added_count', 1);
    }

    public function test_notebook_details_returns_only_requested_user_entries(): void
    {
        $manager = User::factory()->manager()->create();
        $salesUser = User::factory()->sales()->create([
            'user_firstname' => 'Sale',
            'user_lastname' => 'Owner',
        ]);
        $otherSalesUser = User::factory()->sales()->create([
            'user_firstname' => 'Other',
            'user_lastname' => 'Owner',
        ]);

        $salesNotebook = $this->createNotebook($salesUser, [
            'nb_customer_name' => 'Notebook A',
        ]);
        $otherNotebook = $this->createNotebook($otherSalesUser, [
            'nb_customer_name' => 'Notebook B',
        ]);

        NotebookHistory::create([
            'notebook_id' => $salesNotebook->id,
            'action' => 'updated',
            'old_values' => ['nb_status' => 'old'],
            'new_values' => ['nb_status' => 'new'],
            'action_by' => $salesUser->user_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        NotebookHistory::create([
            'notebook_id' => $otherNotebook->id,
            'action' => 'updated',
            'old_values' => ['nb_status' => 'old'],
            'new_values' => ['nb_status' => 'new'],
            'action_by' => $otherSalesUser->user_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($manager);

        $response = $this->getJson('/api/v1/customers/kpi/notebook-details?period=month&source_filter=all&user_id='.$salesUser->user_id)
            ->assertOk();

        $response->assertJsonPath('status', 'success');
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.notebook_id', $salesNotebook->id);
        $response->assertJsonPath('data.0.action_by_name', 'Sale Owner');
    }

    private function createNotebook(User $owner, array $overrides = []): Notebook
    {
        return Notebook::withoutEvents(function () use ($owner, $overrides) {
            $notebook = new Notebook(array_merge([
                'nb_customer_name' => 'Notebook Test',
                'nb_status' => 'Pending',
                'nb_manage_by' => $owner->user_id,
                'nb_workflow' => Notebook::WORKFLOW_STANDARD,
                'nb_entry_type' => Notebook::ENTRY_TYPE_STANDARD,
            ], $overrides));

            $notebook->created_by = $owner->user_id;
            $notebook->updated_by = $owner->user_id;
            $notebook->save();

            return $notebook;
        });
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

    private function setNotebookDates(Notebook $notebook, string $nbDate, string $createdAt, string $updatedAt): void
    {
        DB::table('notebooks')
            ->where('id', $notebook->id)
            ->update([
                'nb_date' => $nbDate,
                'created_at' => $createdAt,
                'updated_at' => $updatedAt,
            ]);
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
