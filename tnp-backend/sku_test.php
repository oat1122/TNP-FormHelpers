<?php

// Mocking the scenario to test SKU logic logic
$prefix = "TNP";
$ym = "202402";
$skuPrefix = "{$prefix}-{$ym}-";

// Scenario 1: No previous product
$lastSKU = null;
$nextNum1 = 1;
if ($lastSKU && preg_match('/-(\d+)$/', $lastSKU, $matches)) {
    $nextNum1 = intval($matches[1]) + 1;
}
$sp_sku1 = $skuPrefix . str_pad($nextNum1, 2, '0', STR_PAD_LEFT);
echo "Scenario 1 (No previous): $sp_sku1\n";

// Scenario 2: Previous product exists (01)
$lastSKU = "TNP-202402-01";
$nextNum2 = 1;
if ($lastSKU && preg_match('/-(\d+)$/', $lastSKU, $matches)) {
    $nextNum2 = intval($matches[1]) + 1;
}
$sp_sku2 = $skuPrefix . str_pad($nextNum2, 2, '0', STR_PAD_LEFT);
echo "Scenario 2 (Previous 01): $sp_sku2\n";

// Scenario 3: Previous product exists (09)
$lastSKU = "TNP-202402-09";
$nextNum3 = 1;
if ($lastSKU && preg_match('/-(\d+)$/', $lastSKU, $matches)) {
    $nextNum3 = intval($matches[1]) + 1;
}
$sp_sku3 = $skuPrefix . str_pad($nextNum3, 2, '0', STR_PAD_LEFT);
echo "Scenario 3 (Previous 09): $sp_sku3\n";

// Scenario 4: Previous product exists (99)
$lastSKU = "TNP-202402-99";
$nextNum4 = 1;
if ($lastSKU && preg_match('/-(\d+)$/', $lastSKU, $matches)) {
    $nextNum4 = intval($matches[1]) + 1;
}
$sp_sku4 = $skuPrefix . str_pad($nextNum4, 2, '0', STR_PAD_LEFT);
echo "Scenario 4 (Previous 99): $sp_sku4\n";
