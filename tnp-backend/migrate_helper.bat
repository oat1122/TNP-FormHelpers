@echo off
echo ===================================
echo TNP FormHelpers - Migration Helper
echo ===================================

echo.
echo 1. Check migration status
echo 2. Run new combined migrations
echo 3. Auto-disable existing migrations (Fix "Table exists" error)
echo 4. Manually disable all migrations in the list
echo 5. Rollback last migration
echo 6. Refresh migrations (WARNING: This will delete all data)
echo 7. Reset migrations (WARNING: This will delete all data and recreate all tables)
echo.

set /p choice="Select option (1-7): "

if "%choice%"=="1" (
    echo.
    echo Checking migration status...
    php artisan migrate:status
) else if "%choice%"=="2" (
    echo.
    echo Running new combined migrations...
    php artisan migrate --path=database/migrations/2025_07_10_000000_disable_old_migrations.php
    php artisan migrate --path=database/migrations/2025_07_10_000010_create_combined_max_supplies_table.php
    php artisan migrate --path=database/migrations/2025_07_10_000020_create_combined_activity_logs_table.php
) else if "%choice%"=="3" (
    echo.
    echo Auto-disabling existing migrations...
    php artisan migrate --path=database/migrations/2025_07_10_000005_auto_disable_existing_migrations.php
    echo.
    echo Now you can safely run migrations again.
) else if "%choice%"=="4" (
    echo.
    echo Manually disabling all migrations in the list...
    php artisan migrate --path=database/migrations/2025_07_10_000000_disable_old_migrations.php
    echo.
    echo All migrations in the list have been disabled.
) else if "%choice%"=="5" (
    echo.
    echo Rolling back last migration...
    php artisan migrate:rollback --step=1
) else if "%choice%"=="6" (
    echo.
    echo WARNING: This will delete all data in the affected tables!
    set /p confirm="Are you sure you want to continue? (y/n): "
    if "%confirm%"=="y" (
        echo Refreshing migrations...
        php artisan migrate:refresh --path=database/migrations/2025_07_10_000010_create_combined_max_supplies_table.php
        php artisan migrate:refresh --path=database/migrations/2025_07_10_000020_create_combined_activity_logs_table.php
    ) else (
        echo Operation cancelled.
    )
) else if "%choice%"=="7" (
    echo.
    echo WARNING: This will delete ALL data in your database!
    set /p confirm="Are you sure you want to continue? (y/n): "
    if "%confirm%"=="y" (
        echo Resetting migrations...
        php artisan migrate:fresh
    ) else (
        echo Operation cancelled.
    )
) else (
    echo Invalid option. Please run the script again.
)

echo.
echo Done.
pause
