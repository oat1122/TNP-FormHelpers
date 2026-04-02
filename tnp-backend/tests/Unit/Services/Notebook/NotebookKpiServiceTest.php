<?php

namespace Tests\Unit\Services\Notebook;

use App\Models\Notebook;
use App\Models\NotebookHistory;
use App\Models\User\User;
use App\Services\Notebook\NotebookKpiService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotebookKpiServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('notebook_histories');
        Schema::dropIfExists('notebooks');
        Schema::dropIfExists('user_sub_roles');
        Schema::dropIfExists('master_sub_roles');
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

        Schema::create('user_sub_roles', function (Blueprint $table) {
            $table->char('usr_id', 36)->primary();
            $table->unsignedBigInteger('usr_user_id');
            $table->char('usr_sub_role_id', 36);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamp('created_at')->nullable();
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
            $table->string('nb_workflow')->default('standard');
            $table->json('nb_lead_payload')->nullable();
            $table->timestamp('nb_claimed_at')->nullable();
            $table->timestamp('nb_converted_at')->nullable();
            $table->char('nb_converted_customer_id', 36)->nullable();
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

    public function test_summary_filters_by_source_using_support_sales_subrole_when_manage_by_is_null(): void
    {
        $manager = User::factory()->manager()->create();
        $supportSalesUser = User::factory()->create([
            'role' => 'production',
            'user_firstname' => 'Support',
            'user_lastname' => 'Owner',
        ]);
        $this->attachSubRole($supportSalesUser, 'SUPPORT_SALES');
        $onlineUser = User::factory()->create([
            'role' => 'sale',
            'user_firstname' => 'Online',
            'user_lastname' => 'Owner',
        ]);

        $salesNotebook = $this->createNotebook($supportSalesUser, [
            'nb_manage_by' => null,
            'nb_is_online' => false,
            'nb_workflow' => 'lead_queue',
        ]);
        $onlineNotebook = $this->createNotebook($onlineUser, [
            'nb_manage_by' => null,
            'nb_is_online' => true,
        ]);

        NotebookHistory::create([
            'notebook_id' => $salesNotebook->id,
            'action' => 'created_to_queue',
            'old_values' => null,
            'new_values' => ['nb_customer_name' => 'Sales Notebook'],
            'action_by' => $supportSalesUser->user_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        NotebookHistory::create([
            'notebook_id' => $onlineNotebook->id,
            'action' => 'created',
            'old_values' => null,
            'new_values' => ['nb_customer_name' => 'Online Notebook'],
            'action_by' => $onlineUser->user_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $result = app(NotebookKpiService::class)->getSummaryData(
            'month',
            now()->startOfMonth()->toDateString(),
            now()->endOfMonth()->toDateString(),
            'sales',
            null,
            $manager,
            'all'
        );

        $this->assertCount(1, $result['summary']);
        $this->assertSame($supportSalesUser->user_id, $result['summary'][0]['user_id']);
        $this->assertSame(1, $result['summary'][0]['added_count']);
    }

    public function test_summary_treats_created_to_queue_as_added_count(): void
    {
        $manager = User::factory()->manager()->create();
        $supportSalesUser = User::factory()->create([
            'role' => 'production',
            'user_firstname' => 'Support',
            'user_lastname' => 'Agent',
        ]);
        $this->attachSubRole($supportSalesUser, 'SUPPORT_SALES');

        $queueNotebook = $this->createNotebook($supportSalesUser, [
            'nb_manage_by' => null,
            'nb_workflow' => 'lead_queue',
        ]);

        NotebookHistory::create([
            'notebook_id' => $queueNotebook->id,
            'action' => 'created_to_queue',
            'old_values' => null,
            'new_values' => ['nb_customer_name' => 'Queue Notebook'],
            'action_by' => $supportSalesUser->user_id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $result = app(NotebookKpiService::class)->getSummaryData(
            'month',
            now()->startOfMonth()->toDateString(),
            now()->endOfMonth()->toDateString(),
            'sales',
            null,
            $manager,
            'all'
        );

        $this->assertCount(1, $result['summary']);
        $this->assertSame(1, $result['summary'][0]['added_count']);
        $this->assertSame(0, $result['summary'][0]['updated_count']);
    }

    private function createNotebook(User $owner, array $overrides = []): Notebook
    {
        return Notebook::withoutEvents(function () use ($owner, $overrides) {
            $notebook = new Notebook(array_merge([
                'nb_customer_name' => 'Notebook Test',
                'nb_status' => 'test',
                'nb_manage_by' => $owner->user_id,
                'nb_workflow' => 'standard',
            ], $overrides));

            $notebook->created_by = $owner->user_id;
            $notebook->updated_by = $owner->user_id;
            $notebook->save();

            return $notebook;
        });
    }

    private function attachSubRole(User $user, string $code): void
    {
        $subRoleId = (string) Str::uuid();

        \DB::table('master_sub_roles')->insert([
            'msr_id' => $subRoleId,
            'msr_code' => $code,
            'msr_name' => $code,
            'msr_description' => null,
            'msr_is_active' => true,
            'msr_sort' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        \DB::table('user_sub_roles')->insert([
            'usr_id' => (string) Str::uuid(),
            'usr_user_id' => $user->user_id,
            'usr_sub_role_id' => $subRoleId,
            'created_by' => $user->user_id,
            'created_at' => now(),
        ]);

        $user->unsetRelation('subRoles');
    }
}
