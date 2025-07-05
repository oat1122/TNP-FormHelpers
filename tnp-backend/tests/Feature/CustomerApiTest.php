<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\MasterCustomer;
use App\Models\MasterCustomerGroup;
use App\Models\CustomerDetail;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class CustomerApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Use in-memory sqlite for testing
        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        $this->artisan('migrate');
    }

    public function test_can_fetch_customer_list()
    {
        // create user
        $user = User::create([
            'user_uuid' => (string) Str::uuid(),
            'username' => 'tester',
            'password' => 'secret',
            'role' => 'admin',
            'enable' => 'Y',
            'user_is_enable' => true,
            'deleted' => 0,
            'user_is_deleted' => false,
            'new_pass' => Hash::make('secret'),
        ]);

        // create customer group
        $group = MasterCustomerGroup::create([
            'mcg_name' => 'A',
            'mcg_sort' => 1,
            'mcg_is_use' => true,
        ]);

        // create customer
        $customer = MasterCustomer::create([
            'cus_id' => (string) Str::uuid(),
            'cus_mcg_id' => $group->mcg_id,
            'cus_no' => 'CUS001',
            'cus_channel' => 1,
            'cus_company' => 'Test Co',
            'cus_firstname' => 'John',
            'cus_lastname' => 'Doe',
            'cus_name' => 'JD',
            'cus_tel_1' => '1234567890',
            'cus_manage_by' => $user->user_id,
            'cus_is_use' => true,
            'cus_created_date' => now(),
        ]);

        CustomerDetail::create([
            'cd_id' => (string) Str::uuid(),
            'cd_cus_id' => $customer->cus_id,
            'cd_is_use' => true,
            'cd_created_date' => now(),
        ]);

        $response = $this->getJson("/api/v1/customers?user={$user->user_id}");

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data',
                     'groups',
                     'total_count',
                     'pagination'
                 ]);
    }
}
