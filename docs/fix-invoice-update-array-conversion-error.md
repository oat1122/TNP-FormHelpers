# Fix: Invoice Update API 500 Error - Array to String Conversion

## ปัญหา (Problem)
```
InvoiceDetailDialog.jsx:156 
PUT http://localhost:8000/api/v1/invoices/382f4624-83a3-4aa6-a52c-cc2b3ef8f220 500 (Internal Server Error)
Error: "Array to string conversion"
```

## สาเหตุ (Root Cause)
การเกิดข้อผิดพลาด "Array to string conversion" ใน `InvoiceService::update()` method เกิดจาก:

1. **Model Casting**: Invoice model มี fields ที่ cast เป็น array
   ```php
   protected $casts = [
       'primary_pricing_request_ids' => 'array',
       'customer_snapshot' => 'array', 
       'signature_images' => 'array',
       'sample_images' => 'array',
   ];
   ```

2. **Array Comparison Issue**: การใช้ `array_diff_assoc()` เพื่อเปรียบเทียบ old/new data
   ```php
   $changes = array_diff_assoc($invoice->toArray(), $oldData);
   // array fields caused issues when trying to implode array keys
   ```

3. **History Logging**: การพยายาม `implode()` keys ที่มี array values
   ```php
   "แก้ไขใบแจ้งหนี้: " . implode(', ', array_keys($changes))
   // Error when $changes contains array values
   ```

## การแก้ไข (Solution)

### เปลี่ยนแปลงใน `InvoiceService.php`

**Before (เดิม):**
```php
// บันทึก History การแก้ไข
$changes = array_diff_assoc($invoice->toArray(), $oldData);
if (!empty($changes)) {
    DocumentHistory::logAction(
        'invoice',
        $invoiceId,
        'update',
        $updatedBy,
        "แก้ไขใบแจ้งหนี้: " . implode(', ', array_keys($changes))
    );
}
```

**After (แก้ไขแล้ว):**
```php
// บันทึก History การแก้ไข - track only simple field changes
$updatedFields = array_keys($updateData);
$changedFields = array_filter($updatedFields, function($field) use ($invoice) {
    return $invoice->isFillable($field) && !in_array($field, [
        'primary_pricing_request_ids', 'customer_snapshot', 
        'signature_images', 'sample_images'
    ]);
});

if (!empty($changedFields)) {
    DocumentHistory::logAction(
        'invoice',
        $invoiceId,
        'update',
        $updatedBy,
        "แก้ไขใบแจ้งหนี้: " . implode(', ', $changedFields)
    );
}
```

## การทดสอบ (Testing)

### 1. API Test
```bash
# Test PUT endpoint
curl -X PUT "http://localhost:8000/api/v1/invoices/382f4624-83a3-4aa6-a52c-cc2b3ef8f220" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -d '{"notes": "Test notes update"}'

# Response: ✅ Success
{
  "success": true,
  "data": { /* updated invoice data */ },
  "message": "Invoice updated successfully"
}
```

### 2. Document History
```json
{
  "action": "update",
  "notes": "แก้ไขใบแจ้งหนี้: notes",
  "created_at": "2025-09-05T03:21:47.000000Z"
}
```

## สิ่งที่แก้ไข (Changes Made)

1. **✅ ป้องกัน Array to String Error**: หลีกเลี่ยงการ implode array values
2. **✅ Selective Field Tracking**: track เฉพาะ simple fields ใน history
3. **✅ Exclude Array Fields**: ไม่ log การเปลี่ยนแปลงใน array fields
4. **✅ Maintain Functionality**: ยังคงฟังก์ชัน update และ history logging

## ผลลัพธ์ (Results)

- **API Working**: PUT /api/v1/invoices/{id} ทำงานถูกต้อง
- **Frontend Fixed**: InvoiceDetailDialog สามารถบันทึกได้
- **History Logging**: บันทึก document history ปกติ
- **No Breaking Changes**: ไม่กระทบฟังก์ชันอื่น

## Status: ✅ RESOLVED

Invoice update API ทำงานถูกต้องแล้ว และ frontend สามารถแก้ไขใบแจ้งหนี้ได้ปกติ
