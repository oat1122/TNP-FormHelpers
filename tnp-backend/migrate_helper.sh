#!/bin/bash

echo "==================================="
echo "TNP FormHelpers - Migration Helper"
echo "==================================="

echo
echo "1. Check migration status"
echo "2. Run new combined migrations"
echo "3. Rollback last migration"
echo "4. Refresh migrations (WARNING: This will delete all data)"
echo "5. Reset migrations (WARNING: This will delete all data and recreate all tables)"
echo

read -p "Select option (1-5): " choice

case $choice in
    1)
        echo
        echo "Checking migration status..."
        php artisan migrate:status
        ;;
    2)
        echo
        echo "Running new combined migrations..."
        php artisan migrate --path=database/migrations/2025_07_10_000000_disable_old_migrations.php
        php artisan migrate --path=database/migrations/2025_07_10_000010_create_combined_max_supplies_table.php
        php artisan migrate --path=database/migrations/2025_07_10_000020_create_combined_activity_logs_table.php
        ;;
    3)
        echo
        echo "Rolling back last migration..."
        php artisan migrate:rollback --step=1
        ;;
    4)
        echo
        echo "WARNING: This will delete all data in the affected tables!"
        read -p "Are you sure you want to continue? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            echo "Refreshing migrations..."
            php artisan migrate:refresh --path=database/migrations/2025_07_10_000010_create_combined_max_supplies_table.php
            php artisan migrate:refresh --path=database/migrations/2025_07_10_000020_create_combined_activity_logs_table.php
        else
            echo "Operation cancelled."
        fi
        ;;
    5)
        echo
        echo "WARNING: This will delete ALL data in your database!"
        read -p "Are you sure you want to continue? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            echo "Resetting migrations..."
            php artisan migrate:fresh
        else
            echo "Operation cancelled."
        fi
        ;;
    *)
        echo "Invalid option. Please run the script again."
        ;;
esac

echo
echo "Done."
read -p "Press Enter to continue..."
