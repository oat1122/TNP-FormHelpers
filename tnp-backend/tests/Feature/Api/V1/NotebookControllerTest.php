<?php

namespace Tests\Feature\Api\V1;

use App\Models\Notebook;
use App\Models\NotebookHistory;
use App\Models\User\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotebookControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('notebook_histories');
        Schema::dropIfExists('notebooks');
        Schema::dropIfExists('users');

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
            $table->timestamp('nb_converted_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });

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
            'nb_status' => 'เธเธดเธเธฒเธฃเธ“เธฒ',
            'nb_manage_by' => $manager->user_id,
        ])->assertOk();

        $this->assertDatabaseHas('notebooks', [
            'id' => $notebook->id,
            'nb_manage_by' => $owner->user_id,
            'nb_status' => 'เธเธดเธเธฒเธฃเธ“เธฒ',
        ]);
    }

    public function test_convert_endpoint_sets_conversion_timestamp_server_side(): void
    {
        $owner = User::factory()->sales()->create();
        $notebook = $this->createNotebook($owner);

        Sanctum::actingAs($owner);

        $this->postJson("/api/v1/notebooks/{$notebook->id}/convert", [
            'nb_status' => 'เนเธ”เนเธเธฒเธ',
            'nb_converted_at' => '2000-01-01T00:00:00.000Z',
        ])->assertOk();

        $this->assertDatabaseHas('notebooks', [
            'id' => $notebook->id,
            'nb_status' => 'เนเธ”เนเธเธฒเธ',
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
            'nb_status' => 'เธเธดเธเธฒเธฃเธ“เธฒ',
            'nb_manage_by' => $owner->user_id,
        ], $overrides));

        $notebook->created_by = $owner->user_id;
        $notebook->updated_by = $owner->user_id;
        $notebook->save();

            return $notebook;
        });
    }
}
