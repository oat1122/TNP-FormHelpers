# Copilot.md - Comprehensive Development Plan

This file provides comprehensive guidance to Copilot when working with the TNP Business Management System, focusing on the accounting module integration.

## Project Overview

This is a comprehensive business management system with Laravel 10 backend and React 18 frontend, featuring a complete accounting workflow inspired by FlowAccount. The system handles textile production, pricing requests, and now includes a full accounting document lifecycle.

### Key Directories:
- `tnp-backend/` - Laravel 10 API backend with PHP 8.1+
- `tnp-frontend/` - React 18 frontend with Vite and Material UI
- `MD/` - Documentation and specifications

## 🎯 Current Development Focus: Accounting System Integration

### Phase 1: Backend Development (Priority: HIGH)

#### Database Integration
The system uses **existing database schema** with prefixed naming convention. **Critical**: Always use the correct table and column names:

**Customer Management:**
- Table: `master_customers`
- Primary Key: `cus_id` (UUID)
- Key Fields: `cus_no`, `cus_firstname`, `cus_lastname`, `cus_company`, `cus_tax_id`, `cus_tel_1`, `cus_email`

**Products:**
- Table: `master_product_categories` 
- Primary Key: `mpc_id` (UUID)
- Key Fields: `mpc_name`, `mpc_remark`

**Accounting Documents:**
- Tables: `quotations`, `invoices`, `receipts`, `delivery_notes`
- Item Tables: `quotation_items`, `invoice_items`, `receipt_items`, `delivery_note_items`
- Support Tables: `document_status_history`, `document_attachments`

#### API Development Guidelines

**RESTful API Structure (Laravel):**
```
/api/v1/accounting/
├── customers/
├── products/
├── quotations/
├── invoices/
├── receipts/
├── delivery-notes/
└── attachments/
```

**Status Flow Implementation:**
```
draft → pending_review → approved → rejected → completed
```

**Role-Based Access Control:**
- Sales: Create, edit (draft), upload evidence
- Account: Review, approve/reject, modify at any stage
- Both: View documents, download PDFs

#### Service Layer Architecture

**Key Services to Implement:**
1. `DocumentNumberService` - Auto-generate document numbers (QT202501-0001)
2. `QuotationService` - Full quotation lifecycle
3. `InvoiceService` - Invoice creation from quotations
4. `ReceiptService` - Tax invoice generation
5. `DeliveryNoteService` - Delivery confirmation
6. `DocumentWorkflowService` - Status transitions
7. `AttachmentService` - File upload/download
8. `PricingIntegrationService` - Pull from existing pricing system

### Phase 2: Frontend Development (Priority: HIGH)

#### Technology Stack
- **Framework**: React 18 with Vite
- **UI Library**: Material UI (MUI) v6
- **State Management**: Redux Toolkit + RTK Query
- **Forms**: React Hook Form + Yup validation
- **Routing**: React Router v6 with lazy loading

#### Page Structure
```
src/pages/Accounting/
├── Dashboard/
├── Quotations/
│   ├── QuotationListPage.jsx
│   ├── QuotationFormPage.jsx (Step Form)
│   └── components/
├── Invoices/
├── Receipts/
├── DeliveryNotes/
└── shared/
    ├── DocumentStatusBadge.jsx
    ├── CustomerAutocomplete.jsx
    ├── ProductSelector.jsx
    └── AttachmentUploader.jsx
```

#### Service Layer (Frontend)
```
src/features/Accounting/services/
├── quotationService.js
├── invoiceService.js
├── receiptService.js
├── deliveryNoteService.js
├── customerService.js
└── productService.js
```

**Example Service Implementation:**
```javascript
import axios from '@/api/axios';

export const quotationService = {
  fetchQuotations: (params) => axios.get('/api/v1/quotations', { params }),
  getQuotation: (id) => axios.get(`/api/v1/quotations/${id}`),
  createQuotation: (data) => axios.post('/api/v1/quotations', data),
  updateQuotation: (id, data) => axios.put(`/api/v1/quotations/${id}`, data),
  changeStatus: (id, status, notes) => 
    axios.patch(`/api/v1/quotations/${id}/status`, { status, notes }),
  downloadPDF: (id) => 
    axios.get(`/api/v1/quotations/${id}/pdf`, { responseType: 'blob' })
};
```

#### UX/UI Design Principles (FlowAccount-inspired)

**Navigation Design:**
- Collapsible side navigation with document type sections
- Status badges showing document counts
- Top tabs for status filtering (All, Pending, Approved, Rejected)

**Listing Pages:**
- Card-based layout with hover effects
- Advanced filtering (date range, customer, status)
- Pagination with configurable page sizes
- Quick action buttons (View, Edit, Download PDF)

**Form Pages (Multi-step):**
- Material UI Stepper component
- Real-time calculation display
- Inline validation with error messaging
- Auto-save drafts functionality

**Document Workflow:**
- Status change confirmations with reason notes
- File upload with drag-and-drop
- PDF preview in modal
- Email integration for document sending

### Phase 3: Integration & Workflow

#### Pricing System Integration
```php
// Existing pricing_requests table integration
class PricingIntegrationService {
    public function getCompletedPricingRequests()
    public function convertToQuotation($pricingRequestId)
    public function syncCustomerData()
}
```

#### Document Conversion Flow
```
Pricing Request (Complete) 
    ↓
Quotation (Sales creates)
    ↓ (Account approves)
Invoice (Auto-generated)
    ↓ (Payment received)
Receipt/Tax Invoice (Account issues)
    ↓ (Goods ready)
Delivery Note (Final step)
```

#### Special Cases Handling
1. **Deposit Changes**: Allow status rollback with proper audit trail
2. **Partial Deliveries**: Support quantity_remaining tracking
3. **Document Amendments**: Credit/Debit note generation
4. **Multi-order Invoicing**: Combine multiple quotations

## 🛠 Development Standards

### Backend Standards
- **PHP 8.1+ Syntax**: Use typed properties, union types, attributes
- **Laravel Conventions**: Service classes, resource classes, form requests
- **Database Transactions**: Wrap multi-table operations
- **Error Handling**: Comprehensive exception handling with user-friendly messages
- **Testing**: Feature tests for all API endpoints, unit tests for services

### Frontend Standards
- **Component Architecture**: Reusable, composable components
- **State Management**: RTK Query for server state, Zustand for UI state
- **Performance**: Code splitting, lazy loading, optimized re-renders
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

### Routing Configuration
```javascript
// src/App.jsx
<Route path="/accounting" element={<AccountingLayout />}>
  <Route path="quotations" element={<QuotationListPage />} />
  <Route path="quotations/create" element={<QuotationFormPage />} />
  <Route path="quotations/:id" element={<QuotationFormPage />} />
  <Route path="invoices" element={<InvoiceListPage />} />
  <Route path="receipts" element={<ReceiptListPage />} />
  <Route path="delivery-notes" element={<DeliveryNoteListPage />} />
</Route>
```

### Control Panel Integration
```javascript
// src/pages/ControlPanel - Add new shortcuts
const accountingShortcuts = [
  {
    label: 'Quotations',
    path: '/accounting/quotations',
    icon: <InsertDriveFileIcon />,
    badge: pendingQuotationsCount
  },
  {
    label: 'Invoices', 
    path: '/accounting/invoices',
    icon: <ReceiptIcon />,
    badge: overdueInvoicesCount
  },
  {
    label: 'Tax Invoices',
    path: '/accounting/receipts', 
    icon: <AssignmentIcon />
  },
  {
    label: 'Delivery Notes',
    path: '/accounting/delivery-notes',
    icon: <LocalShippingIcon />
  }
];
```

### File Upload Security
```php
// Backend validation
'file' => 'required|file|mimes:pdf,jpg,png|max:10240'

// Frontend validation
const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
const maxSize = 10 * 1024 * 1024; // 10MB
```

### PDF Generation
```php
// Use FPDF integration (existing in project)
class DocumentPDFService {
    public function generateQuotationPDF($quotationId)
    public function generateInvoicePDF($invoiceId)
    // Support Thai language, custom templates
}
```

## 🔍 API Endpoints Reference

### Dashboard
```
GET /api/v1/accounting/dashboard/summary
GET /api/v1/accounting/dashboard/revenue-chart
```

### Customers
```
GET    /api/v1/accounting/customers
POST   /api/v1/accounting/customers
GET    /api/v1/accounting/customers/{id}
PUT    /api/v1/accounting/customers/{id}
DELETE /api/v1/accounting/customers/{id}
```

### Quotations
```
GET    /api/v1/quotations
POST   /api/v1/quotations
GET    /api/v1/quotations/{id}
PUT    /api/v1/quotations/{id}
PATCH  /api/v1/quotations/{id}/status
GET    /api/v1/quotations/{id}/pdf
GET    /api/v1/quotations/{id}/history
```

### Invoices
```
GET    /api/v1/invoices
POST   /api/v1/invoices
GET    /api/v1/invoices/overdue
PATCH  /api/v1/invoices/{id}/status
POST   /api/v1/invoices/{id}/payment
```

### Document Attachments
```
POST   /api/v1/accounting/attachments/upload
GET    /api/v1/accounting/attachments/{id}/download
DELETE /api/v1/accounting/attachments/{id}
```

## 🧪 Testing Strategy

### Backend Testing
```bash
# Run accounting module tests
php artisan test tests/Feature/Accounting/
php artisan test tests/Unit/Services/Accounting/

# Key test scenarios
- Document creation workflow
- Status transitions
- Role-based access control
- File upload/download
- PDF generation
- Database transactions
```

### Frontend Testing
```bash
# Component testing with Jest + RTL
npm run test:accounting

# Key test scenarios
- Form validation and submission
- Status change workflows
- File upload functionality
- Responsive design
- Accessibility compliance
```

## 🚀 Deployment Considerations

### Environment Requirements
- **PHP**: 8.1+ (HostAtom compatibility)
- **Database**: MySQL 8.0+ with UTF8MB4
- **Storage**: File storage for attachments (local/S3)
- **Queue**: Redis/database for background jobs

### Performance Optimization
- **Database**: Proper indexing on frequently queried fields
- **API**: Response caching for reference data
- **Frontend**: Bundle optimization, lazy loading
- **Files**: Efficient file serving with proper caching headers

## 📋 Development Checklist

### Backend Development
- [ ] Database migrations with proper foreign keys
- [ ] Model relationships and accessors for database schema alignment
- [ ] Service layer implementation with business logic
- [ ] API controllers with proper validation
- [ ] Resource classes for API responses
- [ ] Authentication middleware setup (Laravel Sanctum)
- [ ] File upload handling with security validation
- [ ] PDF generation service integration
- [ ] Background job processing for heavy operations
- [ ] Comprehensive error handling and logging

### Frontend Development
- [ ] React components with Material UI
- [ ] API integration with RTK Query
- [ ] Form handling with React Hook Form + Yup validation
- [ ] Role-based UI rendering with useUserRole hook
- [ ] File upload with drag-and-drop progress
- [ ] PDF preview functionality in modal
- [ ] Responsive design implementation (mobile-first)
- [ ] Loading and error states handling
- [ ] Toast notifications with Snackbar
- [ ] Navigation and routing integration

### Integration Testing
- [ ] End-to-end workflow testing
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness
- [ ] Performance testing (API < 200ms, UI < 3s)
- [ ] Security testing (file upload, access control)
- [ ] User acceptance testing with actual workflow

## 🔐 Security Implementation

### Authentication & Authorization
```php
// Laravel Sanctum middleware
Route::middleware(['auth:sanctum', 'role:sales,account'])->group(function () {
    Route::apiResource('quotations', QuotationController::class);
});

// Role-based access in controllers
public function approve(Request $request, Quotation $quotation)
{
    $this->authorize('approve', $quotation); // Only account role
}
```

### File Upload Security
```php
// File validation service
class AttachmentService
{
    private const ALLOWED_TYPES = ['pdf', 'jpg', 'jpeg', 'png'];
    private const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    
    public function validateFile(UploadedFile $file): bool
    {
        return in_array($file->getClientOriginalExtension(), self::ALLOWED_TYPES) 
            && $file->getSize() <= self::MAX_SIZE;
    }
}
```

## 📊 Performance Monitoring

### Key Metrics to Track
1. **API Performance**: Response times for document operations
2. **Database Queries**: N+1 query prevention, proper indexing
3. **File Operations**: Upload/download speeds and storage usage
4. **User Experience**: Page load times, form submission success rates
5. **Error Rates**: Failed operations and their causes

### Optimization Strategies
- **Database**: Use eager loading, proper indexes, query optimization
- **Frontend**: Code splitting, lazy loading, memoization
- **Caching**: Redis for frequently accessed data
- **CDN**: Static assets and file attachments

## 🎯 Success Metrics

1. **Functional**: All document types working with proper workflow
2. **Performance**: API response < 200ms, Frontend render < 3s
3. **User Experience**: Intuitive navigation, clear status indicators
4. **Integration**: Seamless connection with existing pricing system
5. **Security**: No vulnerabilities in file upload or user access
6. **Mobile**: Fully responsive design working on all devices

## 📚 Key References

- **FlowAccount Features**: Document conversion, status tracking, multi-currency
- **Database Schema**: Use prefixed column names (cus_*, mpc_*, etc.)
- **API Design**: RESTful with HATEOAS principles
- **UI/UX**: Material Design with FlowAccount-inspired workflow
- **Security**: Laravel Sanctum, CSRF, file validation
- **Performance**: Pagination, lazy loading, optimized queries

This comprehensive plan ensures the accounting system integrates seamlessly with the existing TNP business management system while providing the flexibility and user experience inspired by FlowAccount.