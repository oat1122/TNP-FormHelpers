# มัดจำหลัง (After Deposit) Status Management

## Status Flow Documentation

### 📋 Status Overview
```
draft → pending → approved → sent → partial_paid/fully_paid
              ↓
         pending_after → approved → sent → partial_paid/fully_paid
```

### 🔄 Status Transitions

#### 1. **Switching to มัดจำหลัง (After Mode)**
```php
// When deposit_display_order changes to 'after'
if ($order === 'after') {
    if (!in_array($invoice->status, ['approved', 'sent', 'partial_paid', 'fully_paid', 'overdue'])) {
        $invoice->status = 'pending_after';
    }
}
```

**Triggers:**
- User switches deposit mode from "มัดจำก่อน" to "มัดจำหลัง"
- Status becomes `pending_after` if not already in final processing states

#### 2. **Evidence Upload in After Mode**
```php
// When uploading evidence for 'after' mode
if ($mode === 'after' && $invoice->status === 'pending_after') {
    // Stays in pending_after - requires manual approval
    // Logs evidence upload for tracking
}
```

**Behavior:**
- Upload allowed only when status is `approved` OR `pending_after` for after mode
- Upload button disabled during `pending_after` for after mode until approval

#### 3. **Approval Process**
```php
// Approval works for all pending states
if (!in_array($invoice->status, ['pending','draft','pending_after'])) {
    throw new Exception('Cannot approve');
}
$invoice->status = 'approved';
```

**States that can be approved:**
- `draft` → `approved`
- `pending` → `approved`  
- `pending_after` → `approved`

### 🎯 Business Rules

#### **มัดจำหลัง (After Deposit) Workflow:**

1. **Mode Switch** → Status becomes `pending_after`
2. **Evidence Upload** → Allowed but stays `pending_after`
3. **Manual Approval** → Status becomes `approved`
4. **Normal Flow** → `sent` → `partial_paid`/`fully_paid`

#### **Status Restrictions:**

| Status | Edit Invoice | Upload Evidence | Switch Mode | Approve |
|--------|-------------|----------------|-------------|---------|
| `draft` | ✅ | ❌ | ✅ | ✅ |
| `pending` | ✅ | ❌ | ✅ | ✅ |
| `pending_after` | ✅ | ✅ (after mode only) | ✅ | ✅ |
| `approved` | ❌ | ✅ | ✅ | ❌ |
| `sent` | ❌ | ✅ | ✅ | ❌ |

### 🔍 Frontend Status Display

```javascript
const statusMap = {
  draft: 'แบบร่าง',
  pending: 'รอดำเนินการ',
  pending_after: 'รออนุมัติมัดจำหลัง',
  approved: 'อนุมัติแล้ว',
  rejected: 'ถูกปฏิเสธ',
  sent: 'ส่งแล้ว',
  partial_paid: 'ชำระบางส่วน',
  fully_paid: 'ชำระแล้ว',
  overdue: 'เกินกำหนด'
};
```

### 🛡️ Validation Rules

#### Backend Validation:
```php
// InvoiceController update method
'status' => 'sometimes|in:draft,pending,pending_after,approved,sent,partial_paid,fully_paid,overdue'

// Deposit display order
'deposit_display_order' => 'required|in:before,after'
```

#### API Endpoints:
```http
PATCH /api/v1/invoices/{id}/deposit-display-order
POST /api/v1/invoices/{id}/evidence/{mode}
POST /api/v1/invoices/{id}/approve
```

### 📊 Database Analysis of Current Data

From your CSV data:
```csv
- Invoice 1: status="approved", deposit_display_order="before" ✅
- Invoice 2: status="approved", deposit_display_order="before" ✅
```

Both invoices are correctly in "before" mode with approved status.

### 🧪 Test Scenarios

#### Test Case 1: Switch to After Mode
```bash
# Starting with approved invoice in before mode
PATCH /invoices/{id}/deposit-display-order
{"deposit_display_order": "after"}

# Expected: Status remains "approved" (already processed)
```

#### Test Case 2: Switch to After Mode (Draft)
```bash
# Starting with draft invoice
PATCH /invoices/{id}/deposit-display-order  
{"deposit_display_order": "after"}

# Expected: Status becomes "pending_after"
```

#### Test Case 3: Evidence Upload in After Mode
```bash
# With pending_after status
POST /invoices/{id}/evidence/after
files: [evidence.jpg]

# Expected: Files uploaded, status stays "pending_after"
```

#### Test Case 4: Approve After Evidence
```bash
# With pending_after status + evidence uploaded
POST /invoices/{id}/approve

# Expected: Status becomes "approved"
```

### 🚨 Status Management Fixes Applied

1. ✅ **Fixed validation** - Added `pending_after` to allowed statuses
2. ✅ **Improved logic** - Better status transition rules  
3. ✅ **Evidence flow** - Proper handling of after mode uploads
4. ✅ **Approval process** - Supports `pending_after` approval
5. ✅ **Mode switching** - Handles both directions (before ↔ after)

### 🎯 Summary

The status management for มัดจำหลัง (After Deposit) is now properly implemented with:

- **Clear status flow** with `pending_after` state
- **Proper validation** in all endpoints  
- **Evidence management** per mode
- **Approval workflow** for after deposits
- **Frontend display** with Thai labels
- **Backward compatibility** with existing data

Both backend and frontend now correctly handle the after deposit workflow! 🎉