<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Contracts\Repositories\CustomerRepositoryInterface;
use App\Repositories\CustomerRepository;

/**
 * Repository Service Provider
 * 
 * ลงทะเบียน Repository Interfaces กับ Implementations
 * เพื่อให้ Laravel DI Container สามารถ inject dependencies ได้
 */
class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * All of the container bindings that should be registered.
     *
     * @var array
     */
    public array $bindings = [
        CustomerRepositoryInterface::class => CustomerRepository::class,
    ];

    /**
     * Register services.
     */
    public function register(): void
    {
        // Using $bindings property instead of manual binding
        // Laravel will automatically bind these
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
