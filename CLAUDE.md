# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the TNP Business Management System - a comprehensive textile production and accounting platform built with Laravel 10 backend and React 18 frontend. The system handles textile manufacturing workflows (worksheets, pricing, production monitoring) and includes a complete accounting module with document lifecycle management.

## Commands

### Backend (Laravel)
```bash
# Navigate to backend directory
cd tnp-backend

# Install dependencies
composer install

# Environment setup
cp .env.example .env
php artisan key:generate

# Database operations
php artisan migrate
php artisan db:seed

# Development server
php artisan serve

# Testing
php artisan test
php artisan test tests/Feature/Accounting/
php artisan test tests/Unit/Services/Accounting/

# Code formatting
./vendor/bin/pint
```

### Frontend (React)
```bash
# Navigate to frontend directory
cd tnp-frontend

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Architecture Overview

### Backend Structure (Laravel 10)
- **Models**: Database entities with relationships, located in `app/Models/`
  - Core business models: `Customer`, `MaxSupply`, `Worksheet`, `PricingRequest`
  - Accounting models: `Quotation`, `Invoice`, `Receipt`, `DeliveryNote` with corresponding item models
  - Master data models use prefixed naming: `MasterCustomer`, `MasterProductCategory`

- **Services**: Business logic layer in `app/Services/`
  - `QuotationService`: Complete quotation lifecycle management
  - `DocumentNumberService`: Auto-generate document numbers (QT202501-0001 format)
  - `PricingIntegrationService`: Integration with existing pricing system
  - `WorksheetService`: Production worksheet management

- **Controllers**: API endpoints in `app/Http/Controllers/Api/V1/`
  - RESTful structure with versioning
  - Accounting endpoints under `/api/v1/accounting/`
  - Role-based access control with Laravel Sanctum

### Frontend Structure (React 18)
- **Architecture**: Vite + Material UI + Redux Toolkit
- **Pages**: Feature-based organization in `src/pages/`
  - `Accounting/`: Complete accounting module with sub-pages
  - `MaxSupply/`: Production capacity management
  - `Worksheet/`: Production worksheet management
  - `MonitorProduction/`: Production tracking dashboard

- **State Management**: 
  - Redux Toolkit with RTK Query for server state
  - Feature-based slices in `src/features/`
  - Context providers for complex local state

- **Components**: Reusable components in `src/components/`
  - Form components with React Hook Form + Yup validation
  - Data visualization with Material UI Data Grid
  - Custom UI components following Material Design

### Database Schema
- **Naming Convention**: Prefixed columns (e.g., `cus_id`, `cus_name` for customers)
- **Primary Keys**: UUIDs for main entities, auto-increment for supporting tables
- **Key Tables**:
  - `master_customers`: Customer management with `cus_*` prefix
  - `quotations`/`invoices`/`receipts`: Accounting documents with UUID primary keys
  - `max_supplies`: Production capacity tracking
  - `new_worksheets`: Production worksheet records

### API Design
- RESTful endpoints with consistent response format
- Authentication via Laravel Sanctum with SPA authentication
- Role-based access: `sales` and `account` roles with different permissions
- File upload support for document attachments
- PDF generation for accounting documents

### Document Workflow
```
Pricing Request (Completed) → Quotation (Draft/Pending/Approved) → 
Invoice (Generated) → Receipt/Tax Invoice (Issued) → Delivery Note (Final)
```

## Key Development Patterns

### Service Layer Pattern
Business logic is encapsulated in service classes with dependency injection:
```php
class QuotationService {
    public function createFromPricingRequest($pricingRequestId)
    public function updateStatus($quotationId, $status, $notes)
    public function generatePDF($quotationId)
}
```

### Component Composition (React)
Reusable components with consistent prop interfaces:
```jsx
<CustomerAutocomplete onSelect={handleCustomerSelect} />
<DocumentStatusBadge status={quotation.status} />
<AttachmentUploader onUpload={handleFileUpload} />
```

### Database Transactions
Multi-table operations wrapped in transactions for data consistency.

### Role-Based Access Control
Both backend (Laravel policies) and frontend (conditional rendering) enforce permissions.

## Configuration Notes

### Environment Requirements
- PHP 8.1+ (HostAtom compatibility)
- Node.js 18+ for frontend development
- MySQL 8.0+ with UTF8MB4 collation
- Redis recommended for caching and queues

### Development Setup
1. Backend: Copy `.env.example`, configure database, run migrations
2. Frontend: Install npm dependencies, configure API endpoints in `src/api/apiConfig.js`
3. Both servers must run simultaneously for full functionality

### File Upload Configuration
- Max file size: 10MB
- Allowed types: PDF, JPG, PNG for document attachments
- Storage: Local filesystem with plans for S3 integration

## Testing Strategy

### Backend Testing
- Feature tests for all API endpoints
- Unit tests for service layer business logic
- Database transactions tested for consistency
- File upload and PDF generation tested

### Frontend Testing
- Component testing with Jest + React Testing Library
- Form validation and submission workflows
- State management and API integration
- Responsive design and accessibility

## Performance Considerations

- Database queries optimized with proper indexing
- Eager loading for relationships to prevent N+1 queries
- Frontend code splitting and lazy loading implemented
- File serving optimized with proper caching headers
- API response caching for reference data

## Security Implementation

- Laravel Sanctum for SPA authentication
- CSRF protection enabled
- File upload validation and type checking
- Role-based access control throughout the application
- SQL injection prevention through Eloquent ORM

## Integration Points

- Existing pricing system integration via `PricingIntegrationService`
- PDF generation using existing FPDF library setup
- Thai language support in PDF documents
- Material UI theming consistent across all pages