# 🏗️ Project Structure & Anti-Overlap Guidelines

## 📁 Directory Structure

```
src/
├── pages/
│   └── Accounting/
│       └── PricingIntegration/
│           ├── PricingIntegration.jsx          # Main container component
│           └── components/
│               ├── index.js                    # Export barrel
│               ├── PricingRequestCard.jsx      # Individual card component
│               ├── CreateQuotationModal.jsx    # Modal components
│               ├── CreateQuotationForm.jsx     # Form components
│               ├── FilterSection.jsx           # Filter components
│               ├── PaginationSection.jsx       # Pagination components
│               ├── LoadingState.jsx           # Loading states
│               ├── ErrorState.jsx             # Error states
│               ├── EmptyState.jsx             # Empty states
│               ├── Header.jsx                 # Header component
│               └── FloatingActionButton.jsx   # FAB component
├── features/
│   └── Accounting/
│       ├── accountingSlice.js                 # Redux state
│       └── accountingApi.js                   # RTK Query API
└── components/
    └── shared/                                # Reusable components
```

## 🚫 Anti-Overlap Strategies

### 1. Component Isolation
- ✅ Each component has single responsibility
- ✅ Props flow down, events flow up
- ❌ No direct state manipulation between siblings

### 2. State Management
- ✅ Use Redux for global state (filters, notifications)
- ✅ Use local state for component-specific data
- ❌ No prop drilling beyond 2 levels

### 3. API Management
- ✅ Use RTK Query for data fetching
- ✅ Implement proper caching strategies
- ❌ No duplicate API calls for same data

### 4. Event Handling
- ✅ Use callback props for parent-child communication
- ✅ Implement debouncing for search/filter actions
- ❌ No global event listeners unless necessary

## 🎯 Component Communication Patterns

### Parent → Child (Props Down)
```javascript
<PricingRequestCard
  group={group}
  onCreateQuotation={handleCreateQuotation}
  onViewDetails={handleViewDetails}
/>
```

### Child → Parent (Events Up)
```javascript
const handleCreateQuotation = (group) => {
  // Handle in parent component
  setSelectedPricingRequest(group.requests[0]);
  setShowCreateModal(true);
};
```

### Sibling Communication (Via Parent)
```javascript
// ❌ Direct sibling communication
SiblingA.setState() → SiblingB.forceUpdate()

// ✅ Through parent state
Parent.setState() → SiblingA.props → SiblingB.props
```

## 🔄 Data Flow Architecture

```
API Layer (RTK Query)
    ↓
Redux Store (Global State)
    ↓
Container Component (PricingIntegration)
    ↓
Presentation Components (Cards, Modals, Forms)
    ↓
UI Components (Buttons, Inputs, Chips)
```

## 🛡️ Best Practices

### Performance Optimization
- ✅ Use React.memo for expensive renders
- ✅ Implement virtualization for large lists
- ✅ Use useMemo/useCallback appropriately
- ❌ Don't optimize prematurely

### Error Handling
- ✅ Implement error boundaries
- ✅ Use proper error states in UI
- ✅ Handle network errors gracefully
- ❌ Don't let errors crash the app

### Accessibility
- ✅ Use semantic HTML elements
- ✅ Implement proper ARIA labels
- ✅ Ensure keyboard navigation
- ❌ Don't rely only on mouse interactions

---

**Guidelines by**: แต้ม (Fullstack Developer)  
**Focus**: UX Design & Performance  
**Last Updated**: August 2025
