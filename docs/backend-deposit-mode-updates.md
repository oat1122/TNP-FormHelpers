# Backend Updates for Deposit Mode Switch Implementation

## Updated Files

### 1. InvoiceController.php
- **Modified**: `updateDepositDisplayOrder()` method
  - Changed from POST to PATCH method
  - Updated request validation to use `deposit_display_order` field name
  
- **Added**: `uploadEvidenceByMode()` method
  - New endpoint: `POST /invoices/{id}/evidence/{mode}`
  - Supports mode-specific evidence uploads
  - Validates mode parameter (before/after)

### 2. InvoiceService.php
- **Modified**: `updateDepositDisplayOrder()` method
  - Added logic to set status to `pending_after` when switching to 'after' mode
  - Checks if evidence exists for the mode before setting status
  
- **Added**: `hasEvidenceForMode()` private method
  - Checks if invoice has evidence files for specific mode
  - Handles both legacy array and new object structures
  
- **Added**: `uploadEvidenceByMode()` method
  - Mode-specific evidence upload functionality
  - Stores evidence in new structure: `{ before: [...], after: [...] }`
  - Maintains backward compatibility with legacy array structure

### 3. routes/api.php
- **Modified**: Deposit display order route
  - Changed from `POST` to `PATCH /invoices/{id}/deposit-display-order`
  
- **Added**: Mode-specific evidence upload route
  - `POST /invoices/{id}/evidence/{mode}`

## API Endpoints Updated

### Deposit Display Order
```http
PATCH /api/v1/invoices/{id}/deposit-display-order
Content-Type: application/json

{
  "deposit_display_order": "before" | "after"
}
```

### Mode-Specific Evidence Upload
```http
POST /api/v1/invoices/{id}/evidence/{mode}
Content-Type: multipart/form-data

files[]: File[]
description?: string
mode: "before" | "after" (from URL parameter)
```

## Database Schema Alignment

The implementation aligns with the provided schema:
- ✅ `deposit_display_order` VARCHAR(10) DEFAULT 'after'
- ✅ `status` ENUM includes 'pending_after'
- ✅ `evidence_files` LONGTEXT for JSON storage

## Data Structure Changes

### Evidence Files Structure
**Legacy Format (backward compatible):**
```json
["filename1.jpg", "filename2.png"]
```

**New Format:**
```json
{
  "before": ["filename1.jpg", "filename2.png"],
  "after": ["filename3.jpg"]
}
```

## Status Flow Logic

1. **When switching to 'after' mode:**
   - If invoice not approved AND no evidence for 'after' mode
   - Status automatically set to `pending_after`

2. **Evidence upload restrictions:**
   - Upload allowed when status is `approved`
   - For 'after' mode: uploads disabled when status is `pending_after`

## Backward Compatibility

- ✅ Existing evidence files (array format) treated as 'before' mode
- ✅ Legacy upload endpoint still works
- ✅ Automatic migration to new structure on mode-specific uploads
- ✅ Frontend can handle both data formats

## Testing Checklist

### API Endpoints
- [ ] PATCH `/invoices/{id}/deposit-display-order` with valid modes
- [ ] POST `/invoices/{id}/evidence/before` with file uploads
- [ ] POST `/invoices/{id}/evidence/after` with file uploads
- [ ] Invalid mode parameters return 422 validation errors

### Data Persistence
- [ ] `deposit_display_order` saves correctly to database
- [ ] Evidence files stored in new structure format
- [ ] Status transitions to `pending_after` when appropriate
- [ ] Document history logs mode changes

### Business Logic
- [ ] Mode switching triggers status change when conditions met
- [ ] Evidence separation by mode works correctly
- [ ] Legacy data continues to function properly

---

*Backend implementation ready for integration with updated frontend*
*All changes maintain backward compatibility while adding new functionality*