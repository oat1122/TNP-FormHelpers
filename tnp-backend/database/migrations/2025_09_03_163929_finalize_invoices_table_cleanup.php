<?php

/**
 * Migration 3: finalize_invoices_table_cleanup
 * ทำความสะอาดและเพิ่ม foreign keys, triggers
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ลบ columns เดิมที่ไม่ใช้แล้วจาก invoices (ตรวจสอบว่ามีอยู่ก่อนลบ)
        Schema::table('invoices', function (Blueprint $table) {
            // ตรวจสอบและลบ columns ที่มีอยู่เท่านั้น
            $columnsToRemove = ['work_name', 'fabric_type', 'pattern', 'color', 'sizes', 'quantity'];
            $existingColumns = Schema::getColumnListing('invoices');
            
            foreach ($columnsToRemove as $column) {
                if (in_array($column, $existingColumns)) {
                    $table->dropColumn($column);
                }
            }
        });

        // เปลี่ยนชื่อ work_name_new กลับเป็น work_name (ถ้ามีอยู่)
        if (Schema::hasColumn('invoices', 'work_name_new')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->renameColumn('work_name_new', 'work_name');
            });
        }

        // เพิ่ม foreign key constraints สำหรับ invoices (เฉพาะที่มี table และ column ที่มีอยู่จริง)
        if (Schema::hasTable('quotations') && Schema::hasColumn('invoices', 'quotation_id')) {
            try {
                Schema::table('invoices', function (Blueprint $table) {
                    $table->foreign('quotation_id', 'fk_invoices_quotation')
                        ->references('id')->on('quotations')
                        ->onDelete('set null')->onUpdate('cascade');
                });
            } catch (Exception $e) {
                // Foreign key already exists or other issue
            }
        }

        if (Schema::hasTable('master_customers') && Schema::hasColumn('invoices', 'customer_id')) {
            try {
                Schema::table('invoices', function (Blueprint $table) {
                    $table->foreign('customer_id', 'fk_invoices_customer')
                        ->references('cus_id')->on('master_customers')
                        ->onDelete('set null')->onUpdate('cascade');
                });
            } catch (Exception $e) {
                // Foreign key already exists or other issue
            }
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'user_uuid')) {
            if (Schema::hasColumn('invoices', 'created_by')) {
                try {
                    Schema::table('invoices', function (Blueprint $table) {
                        $table->foreign('created_by', 'fk_invoices_created_by')
                            ->references('user_uuid')->on('users')
                            ->onDelete('set null')->onUpdate('cascade');
                    });
                } catch (Exception $e) {
                    // Foreign key already exists or other issue
                }
            }
            
            if (Schema::hasColumn('invoices', 'updated_by')) {
                try {
                    Schema::table('invoices', function (Blueprint $table) {
                        $table->foreign('updated_by', 'fk_invoices_updated_by')
                            ->references('user_uuid')->on('users')
                            ->onDelete('set null')->onUpdate('cascade');
                    });
                } catch (Exception $e) {
                    // Foreign key already exists or other issue
                }
            }
        }

        // เพิ่ม foreign key constraints สำหรับ invoice_items (ถ้า table มีอยู่)
        if (Schema::hasTable('invoice_items')) {
            try {
                Schema::table('invoice_items', function (Blueprint $table) {
                    $table->foreign('invoice_id', 'fk_invoice_items_invoice')
                        ->references('id')->on('invoices')
                        ->onDelete('cascade');
                });
            } catch (Exception $e) {
                // Foreign key already exists or other issue
            }

            if (Schema::hasTable('quotation_items')) {
                try {
                    Schema::table('invoice_items', function (Blueprint $table) {
                        $table->foreign('quotation_item_id', 'fk_invoice_items_quotation_item')
                            ->references('id')->on('quotation_items')
                            ->onDelete('set null')->onUpdate('cascade');
                    });
                } catch (Exception $e) {
                    // Foreign key already exists or other issue
                }
            }

            if (Schema::hasTable('users') && Schema::hasColumn('users', 'user_uuid')) {
                try {
                    Schema::table('invoice_items', function (Blueprint $table) {
                        $table->foreign('created_by', 'fk_invoice_items_created_by')
                            ->references('user_uuid')->on('users')
                            ->onDelete('set null')->onUpdate('cascade');
                        
                        $table->foreign('updated_by', 'fk_invoice_items_updated_by')
                            ->references('user_uuid')->on('users')
                            ->onDelete('set null')->onUpdate('cascade');
                    });
                } catch (Exception $e) {
                    // Foreign key already exists or other issue
                }
            }
        }

        // สร้าง triggers สำหรับอัปเดตยอดรวมอัตโนมัติ (ถ้า table invoice_items มีอยู่)
        if (Schema::hasTable('invoice_items')) {
            $this->createTriggers();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // ลบ triggers
        $this->dropTriggers();

        // ลบ foreign keys (ตรวจสอบว่ามีอยู่ก่อนลบ)
        $this->dropForeignKeysIfExists();

        // คืนค่า columns เดิม
        if (Schema::hasColumn('invoices', 'work_name')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->renameColumn('work_name', 'work_name_new');
            });
        }

        Schema::table('invoices', function (Blueprint $table) {
            $table->string('work_name', 100)->nullable()->comment('ชื่องาน');
            $table->string('fabric_type')->nullable()->comment('ชนิดผ้า');
            $table->string('pattern')->nullable()->comment('แพทเทิร์น');
            $table->string('color')->nullable()->comment('สีสินค้า');
            $table->string('sizes')->nullable()->comment('ไซซ์');
            $table->string('quantity', 10)->nullable()->comment('จำนวน');
        });

        // Copy ข้อมูลกลับ
        if (Schema::hasColumn('invoices', 'work_name_new')) {
            DB::statement('UPDATE invoices SET work_name = work_name_new WHERE work_name_new IS NOT NULL');
            
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropColumn('work_name_new');
            });
        }
    }

    /**
     * สร้าง triggers สำหรับอัปเดตยอดรวม
     */
    private function createTriggers(): void
    {
        // ลบ triggers เดิมก่อน (ถ้ามี)
        $this->dropTriggers();

        // ตรวจสอบว่า invoices table มี columns ที่จำเป็น
        $invoiceColumns = Schema::getColumnListing('invoices');
        $requiredColumns = ['subtotal', 'has_vat', 'vat_percentage', 'vat_amount', 'total_amount', 'final_total_amount', 'special_discount_amount', 'withholding_tax_amount'];
        
        $hasAllColumns = true;
        foreach ($requiredColumns as $column) {
            if (!in_array($column, $invoiceColumns)) {
                $hasAllColumns = false;
                break;
            }
        }

        if (!$hasAllColumns) {
            return; // ไม่สร้าง triggers ถ้า columns ไม่ครบ
        }

        // Trigger สำหรับ INSERT
        DB::unprepared('
            CREATE TRIGGER update_invoice_totals_after_item_insert 
            AFTER INSERT ON invoice_items 
            FOR EACH ROW 
            BEGIN
                UPDATE invoices SET 
                    subtotal = (SELECT COALESCE(SUM((unit_price * quantity) - discount_amount), 0) FROM invoice_items WHERE invoice_id = NEW.invoice_id),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.invoice_id;
                
                UPDATE invoices SET 
                    vat_amount = CASE WHEN has_vat = 1 THEN subtotal * (vat_percentage / 100) ELSE 0 END,
                    total_amount = subtotal + CASE WHEN has_vat = 1 THEN subtotal * (vat_percentage / 100) ELSE 0 END,
                    final_total_amount = subtotal + CASE WHEN has_vat = 1 THEN subtotal * (vat_percentage / 100) ELSE 0 END - special_discount_amount - withholding_tax_amount,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.invoice_id;
            END
        ');

        // Trigger สำหรับ UPDATE
        DB::unprepared('
            CREATE TRIGGER update_invoice_totals_after_item_update 
            AFTER UPDATE ON invoice_items 
            FOR EACH ROW 
            BEGIN
                UPDATE invoices SET 
                    subtotal = (SELECT COALESCE(SUM((unit_price * quantity) - discount_amount), 0) FROM invoice_items WHERE invoice_id = NEW.invoice_id),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.invoice_id;
                
                UPDATE invoices SET 
                    vat_amount = CASE WHEN has_vat = 1 THEN subtotal * (vat_percentage / 100) ELSE 0 END,
                    total_amount = subtotal + CASE WHEN has_vat = 1 THEN subtotal * (vat_percentage / 100) ELSE 0 END,
                    final_total_amount = subtotal + CASE WHEN has_vat = 1 THEN subtotal * (vat_percentage / 100) ELSE 0 END - special_discount_amount - withholding_tax_amount,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.invoice_id;
            END
        ');

        // Trigger สำหรับ DELETE
        DB::unprepared('
            CREATE TRIGGER update_invoice_totals_after_item_delete 
            AFTER DELETE ON invoice_items 
            FOR EACH ROW 
            BEGIN
                UPDATE invoices SET 
                    subtotal = (SELECT COALESCE(SUM((unit_price * quantity) - discount_amount), 0) FROM invoice_items WHERE invoice_id = OLD.invoice_id),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = OLD.invoice_id;
                
                UPDATE invoices SET 
                    vat_amount = CASE WHEN has_vat = 1 THEN subtotal * (vat_percentage / 100) ELSE 0 END,
                    total_amount = subtotal + CASE WHEN has_vat = 1 THEN subtotal * (vat_percentage / 100) ELSE 0 END,
                    final_total_amount = subtotal + CASE WHEN has_vat = 1 THEN subtotal * (vat_percentage / 100) ELSE 0 END - special_discount_amount - withholding_tax_amount,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = OLD.invoice_id;
            END
        ');
    }

    /**
     * ลบ triggers
     */
    private function dropTriggers(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS update_invoice_totals_after_item_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS update_invoice_totals_after_item_update');
        DB::unprepared('DROP TRIGGER IF EXISTS update_invoice_totals_after_item_delete');
    }

    /**
     * ลบ foreign keys ถ้ามีอยู่
     */
    private function dropForeignKeysIfExists(): void
    {
        $foreignKeys = [
            'invoices' => [
                'fk_invoices_quotation',
                'fk_invoices_customer', 
                'fk_invoices_created_by',
                'fk_invoices_updated_by'
            ],
            'invoice_items' => [
                'fk_invoice_items_invoice',
                'fk_invoice_items_quotation_item',
                'fk_invoice_items_created_by',
                'fk_invoice_items_updated_by'
            ]
        ];

        foreach ($foreignKeys as $table => $keys) {
            if (Schema::hasTable($table)) {
                foreach ($keys as $key) {
                    try {
                        Schema::table($table, function (Blueprint $table) use ($key) {
                            $table->dropForeign($key);
                        });
                    } catch (Exception $e) {
                        // Foreign key doesn't exist, continue
                    }
                }
            }
        }
    }
};
