<?php

namespace Tests\Unit\Services\Notebook;

use App\Models\Notebook;
use App\Models\User\User;
use App\Services\Notebook\NotebookService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class NotebookServiceTest extends TestCase
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
    }

    public function test_manager_can_reassign_notebook_owner_on_update(): void
    {
        $manager = User::factory()->manager()->create();
        $owner = User::factory()->sales()->create();
        $newOwner = User::factory()->sales()->create();

        $notebook = new Notebook([
            'nb_customer_name' => 'Service Notebook',
            'nb_manage_by' => $owner->user_id,
        ]);
        $notebook->created_by = $owner->user_id;
        $notebook->updated_by = $owner->user_id;
        $notebook->save();

        $updated = app(NotebookService::class)->update((string) $notebook->id, [
            'nb_manage_by' => $newOwner->user_id,
        ], $manager);

        $this->assertSame($newOwner->user_id, $updated->nb_manage_by);
        $this->assertSame($manager->user_id, $updated->updated_by);
    }
}
