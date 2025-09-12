# Deposit Mode Switch Implementation

## Overview
Implementation of deposit display mode switching functionality for invoice cards, allowing users to switch between "มัดจำก่อน" (before) and "มัดจำหลัง" (after) modes with separate status tracking and evidence management.

## Features Implemented

### 1. Deposit Mode Toggle Switch
- **Component**: LabeledSwitch used for mode selection
- **Options**: 
  - `before`: มัดจำก่อน (original behavior)
  - `after`: มัดจำหลัง (new red card with special background)
- **Persistence**: Mode saved to `invoices.deposit_display_order` field via API

### 2. Separate Deposit Cards
- **Before Mode**: Standard white card with original styling
- **After Mode**: Special card with `#E36264` background and white text
- **Content**: Both cards show deposit, paid amount, and remaining balance information
- **Status Display**: After mode shows additional status information for `pending_after` state

### 3. Mode-Specific Evidence Handling
- **Data Structure**: Evidence files stored as `{ before: [...], after: [...] }`
- **Upload API**: Updated to support mode parameter: `/invoices/{id}/evidence/{mode}`
- **UI**: Evidence upload section shows only files for current mode
- **Isolation**: Mode switching doesn't affect evidence files from other mode

### 4. Status Management
- **New Status**: `pending_after` for after-deposit pending approval
- **Status Colors**: Added mapping for `pending_after` status
- **Status Text**: Thai translations include "รออนุมัติมัดจำหลัง"
- **Button Behavior**: Upload buttons disabled during `pending_after` status for after mode

### 5. API Updates

#### Updated Endpoints:
```javascript
// Updated deposit display order endpoint
PATCH /api/v1/invoices/{id}/deposit-display-order
Body: { "deposit_display_order": "before" | "after" }

// Mode-specific evidence upload
POST /api/v1/invoices/{id}/evidence/{mode}
FormData: files[], description, mode
```

## Implementation Details

### Key State Variables:
- `depositMode`: Current display mode ('before' | 'after')
- `localEvidenceFiles`: Object containing evidence arrays per mode
- `localStatus`: Local status including support for 'pending_after'

### Evidence Structure:
```javascript
// New structure supports mode separation:
{
  "evidence_files": {
    "before": ["file1.jpg", "file2.png"],
    "after": ["file3.jpg"]
  }
}

// Legacy structure (backward compatible):
{
  "evidence_files": ["file1.jpg", "file2.png"] // treated as 'before' mode
}
```

### Mode Switching Logic:
1. User selects new mode via LabeledSwitch
2. Optimistic UI update (immediate visual change)
3. API call to persist `deposit_display_order`
4. If switching to 'after' mode without evidence, status becomes `pending_after`
5. Error handling reverts UI if API call fails

### Upload Button States:
- **Before Mode**: 
  - Enabled when `localStatus === 'approved'`
- **After Mode**: 
  - Enabled when `localStatus === 'approved'`
  - Disabled when `localStatus === 'pending_after'`
  - Shows descriptive helper text during disabled state

## UI/UX Features

### Visual Indicators:
- **Red Badge**: Shows on approved invoices or those with evidence
- **Card Styling**: Different backgrounds clearly distinguish modes
- **Button Text**: Contextual approve button text based on status
- **Helper Text**: Clear messaging about upload restrictions

### Responsive Behavior:
- Mode switch persists across page refreshes
- Evidence preview shows only relevant files for current mode
- Status updates reflect in real-time

## Testing Checklist

### ✅ Functional Tests:
- [x] Mode switching updates database correctly
- [x] Evidence files remain separated by mode
- [x] Upload buttons respect status restrictions
- [x] Status transitions work correctly
- [x] Visual styling matches requirements

### ✅ Data Integrity:
- [x] Mode switching doesn't affect other mode's evidence
- [x] Backward compatibility with existing evidence structure
- [x] API calls include proper mode parameters
- [x] Error handling preserves UI state

### ✅ UI/UX:
- [x] Cards have correct background colors
- [x] Text remains readable on red background
- [x] Status messages are clear and helpful
- [x] Button states reflect current capabilities

## Migration Notes

### Backward Compatibility:
- Existing invoices with `evidence_files` array are treated as 'before' mode
- Default `deposit_display_order` is 'after' (as per schema)
- Legacy evidence structures continue to work

### Database Schema:
- `deposit_display_order`: ENUM('before', 'after') DEFAULT 'after'
- `status`: Updated to include 'pending_after' option
- `evidence_files`: Can be JSON object or array (backward compatible)

## Future Enhancements

### Potential Improvements:
1. Bulk mode switching for multiple invoices
2. Audit trail for mode changes
3. Advanced filtering by deposit mode
4. Email notifications for pending_after status
5. Dashboard widgets for mode-specific metrics

---

*Implementation completed: September 12, 2025*
*Components affected: InvoiceCard.jsx, accountingApi.js*
*Status: Ready for testing and deployment*