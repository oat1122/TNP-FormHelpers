# Delivery Note Source Selection - Implementation Summary

## Overview
Successfully transformed the delivery note creation flow from "Select invoice item" to "Select invoice" with expandable item details.

## Changes Made

### 1. Frontend API (accountingApi.js)
- Added `getDeliveryNoteInvoices` endpoint: `/api/v1/delivery-notes/invoices`
- Added `useGetDeliveryNoteInvoicesQuery` hook
- Endpoint filters by approved invoices by default

### 2. DeliveryNoteSourceSelectionDialog.jsx
- **Completely transformed** from item-focused to invoice-focused UI
- **New Components:**
  - `InvoiceCard`: Main invoice display with QuotationCard styling
  - `InvoiceItemRow`: Expandable item details within each invoice
- **Features:**
  - Invoice header with status chips and amount
  - Customer info display
  - Expandable items section with collapse/expand
  - Two selection modes:
    - "Select invoice" (entire invoice)
    - "Select this item" (specific item within invoice)
- **UI Styling**: Consistent with QuotationCard using TNP styled components
- **Language**: Mixed Thai/English as per existing patterns

### 3. DeliveryNoteCreateDialog.jsx
- Updated alert logic to handle both invoice and item selections
- Shows different messages:
  - "Selected invoice item: X from invoice Y" (when item selected)
  - "Selected invoice: X" (when entire invoice selected)
  - "No invoice selected..." (fallback)

### 4. Backend Controller (DeliveryNoteController.php)
- Added `getInvoices()` method
- Route: `GET /api/v1/delivery-notes/invoices`
- Supports pagination, search, status filtering
- Defaults to 'approved' status only

### 5. Backend Service (DeliveryNoteService.php)
- Added `getInvoiceSources()` method
- Returns invoices with embedded items array
- Includes customer relationship data
- Comprehensive search across invoice and item fields
- Proper schema-aware queries (checks for work_name column)

### 6. Backend Routes (api.php)
- Added route: `/delivery-notes/invoices`
- Named route: `delivery-notes.invoices`

## Technical Features

### Selection Data Structure
**Invoice Selection:**
```javascript
{
  invoice_id,
  invoice_number,
  customer_company,
  customer_address,
  customer_tel_1,
  total_amount,
  company_id
}
```

**Item Selection:**
```javascript
{
  invoice_id,
  invoice_item_id,
  invoice_number,
  item_name,
  work_name,
  quantity,
  unit_price,
  customer_company,
  customer_address,
  customer_tel_1,
  company_id
}
```

### UI Components
- Uses TNP styled components for consistency
- Expandable/collapsible item details
- Status chips with proper color coding
- Thai currency formatting
- Responsive grid layout (xs=12, md=6, lg=4)

## Data Flow
1. User opens "Select source" dialog
2. Frontend calls `useGetDeliveryNoteInvoicesQuery`
3. Backend returns approved invoices with items
4. User can either:
   - Select entire invoice → opens creation dialog with invoice data
   - Expand items and select specific item → opens creation dialog with item data
5. Creation dialog shows appropriate alert and pre-fills form fields

## Backward Compatibility
- Original `getInvoiceItems` endpoint preserved
- All existing functionality maintained
- New selection dialog uses new API but supports both selection modes

## Testing Recommendations
1. Test invoice selection (whole invoice)
2. Test item selection (specific items)
3. Test search functionality
4. Test pagination
5. Test with different invoice statuses
6. Verify creation dialog properly handles both selection types
7. Test responsive layout on different screen sizes

## Files Modified
- `/tnp-frontend/src/features/Accounting/accountingApi.js`
- `/tnp-frontend/src/pages/Accounting/DeliveryNotes/components/DeliveryNoteSourceSelectionDialog.jsx`
- `/tnp-frontend/src/pages/Accounting/DeliveryNotes/components/DeliveryNoteCreateDialog.jsx`
- `/tnp-backend/app/Http/Controllers/Api/V1/Accounting/DeliveryNoteController.php`
- `/tnp-backend/app/Services/Accounting/DeliveryNoteService.php`
- `/tnp-backend/routes/api.php`