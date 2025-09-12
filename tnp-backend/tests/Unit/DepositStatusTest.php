<?php

/**
 * Test Script for มัดจำหลัง (After Deposit) Status Management
 * 
 * This script validates the status flow logic for invoice deposit modes
 */

class DepositStatusTest 
{
    /**
     * Test status transition logic
     */
    public static function testStatusTransitions()
    {
        echo "🧪 Testing มัดจำหลัง Status Management\n\n";

        // Test Case 1: Draft invoice switching to after mode
        echo "Test 1: Draft → After Mode\n";
        $invoice = (object)['status' => 'draft', 'deposit_display_order' => 'before'];
        $newStatus = self::calculateStatusAfterModeSwitch($invoice, 'after');
        echo "  Input: {$invoice->status} + switch to after\n";
        echo "  Expected: pending_after\n";
        echo "  Actual: {$newStatus}\n";
        echo "  Result: " . ($newStatus === 'pending_after' ? '✅ PASS' : '❌ FAIL') . "\n\n";

        // Test Case 2: Approved invoice switching to after mode
        echo "Test 2: Approved → After Mode\n";
        $invoice = (object)['status' => 'approved', 'deposit_display_order' => 'before'];
        $newStatus = self::calculateStatusAfterModeSwitch($invoice, 'after');
        echo "  Input: {$invoice->status} + switch to after\n";
        echo "  Expected: approved (no change)\n";
        echo "  Actual: {$newStatus}\n";
        echo "  Result: " . ($newStatus === 'approved' ? '✅ PASS' : '❌ FAIL') . "\n\n";

        // Test Case 3: Pending_after switching back to before
        echo "Test 3: Pending_after → Before Mode\n";
        $invoice = (object)['status' => 'pending_after', 'deposit_display_order' => 'after'];
        $newStatus = self::calculateStatusAfterModeSwitch($invoice, 'before');
        echo "  Input: {$invoice->status} + switch to before\n";
        echo "  Expected: pending\n";
        echo "  Actual: {$newStatus}\n";
        echo "  Result: " . ($newStatus === 'pending' ? '✅ PASS' : '❌ FAIL') . "\n\n";

        // Test Case 4: Validate status enum
        echo "Test 4: Status Validation\n";
        $validStatuses = ['draft', 'pending', 'pending_after', 'approved', 'sent', 'partial_paid', 'fully_paid', 'overdue'];
        $testStatuses = ['draft', 'pending_after', 'approved', 'invalid_status'];
        
        foreach ($testStatuses as $status) {
            $isValid = in_array($status, $validStatuses);
            echo "  Status '{$status}': " . ($isValid ? '✅ VALID' : '❌ INVALID') . "\n";
        }

        echo "\n🎯 Status Management Tests Complete!\n";
    }

    /**
     * Replicate the backend status calculation logic
     */
    private static function calculateStatusAfterModeSwitch($invoice, $newMode)
    {
        $currentStatus = $invoice->status;

        if ($newMode === 'after') {
            // When switching to 'after' mode: set pending_after if not already approved or fully processed
            if (!in_array($currentStatus, ['approved', 'sent', 'partial_paid', 'fully_paid', 'overdue'])) {
                return 'pending_after';
            }
        } else if ($newMode === 'before') {
            // When switching back to 'before' mode: revert from pending_after if needed
            if ($currentStatus === 'pending_after') {
                return 'pending'; // or 'draft' based on business rules
            }
        }

        return $currentStatus; // No status change
    }

    /**
     * Test evidence upload permissions
     */
    public static function testEvidenceUploadPermissions()
    {
        echo "\n🔒 Testing Evidence Upload Permissions\n\n";

        $testCases = [
            ['status' => 'draft', 'mode' => 'before', 'expected' => false],
            ['status' => 'draft', 'mode' => 'after', 'expected' => false],
            ['status' => 'pending', 'mode' => 'before', 'expected' => false],
            ['status' => 'pending', 'mode' => 'after', 'expected' => false],
            ['status' => 'pending_after', 'mode' => 'before', 'expected' => false],
            ['status' => 'pending_after', 'mode' => 'after', 'expected' => true], // Special case
            ['status' => 'approved', 'mode' => 'before', 'expected' => true],
            ['status' => 'approved', 'mode' => 'after', 'expected' => true],
        ];

        foreach ($testCases as $test) {
            $allowed = self::canUploadEvidence($test['status'], $test['mode']);
            $result = $allowed === $test['expected'] ? '✅ PASS' : '❌ FAIL';
            echo "  Status: {$test['status']}, Mode: {$test['mode']} → " . 
                 ($allowed ? 'ALLOWED' : 'DENIED') . " {$result}\n";
        }

        echo "\n🔒 Evidence Upload Tests Complete!\n";
    }

    /**
     * Replicate the evidence upload permission logic
     */
    private static function canUploadEvidence($status, $mode)
    {
        // Standard rule: approved invoices can upload evidence
        if ($status === 'approved') {
            return true;
        }

        // Special rule: pending_after can upload evidence for 'after' mode only
        if ($status === 'pending_after' && $mode === 'after') {
            return true;
        }

        return false;
    }
}

// Run the tests
if (php_sapi_name() === 'cli') {
    DepositStatusTest::testStatusTransitions();
    DepositStatusTest::testEvidenceUploadPermissions();
}