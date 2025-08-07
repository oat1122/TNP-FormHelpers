# 🧪 Customer Update System - Complete Testing Guide

## 🎯 Overview
Complete testing guide for the inline customer update system within the quotation form. This system allows users to edit customer information directly from the CreateQuotationForm and save changes to the tnpdb.master_customers database.

## 📋 Pre-Testing Setup

### Environment Configuration
1. **Check environment variables in `.env`:**
   ```
   VITE_END_POINT_URL=http://localhost:8000/api/v1
   VITE_DEBUG_API=true  # Enable for detailed API logging
   ```

2. **Verify backend is running:**
   ```bash
   cd tnp-backend
   php artisan serve
   ```

3. **Verify frontend is running:**
   ```bash
   cd tnp-frontend
   npm run dev
   ```

4. **Check database connection:**
   - Ensure tnpdb.master_customers table exists
   - Verify user has proper permissions

## 🔍 Testing Checklist

### 1. Component Rendering
- [ ] CustomerEditCard renders correctly in CreateQuotationForm
- [ ] Customer information displays properly when card is collapsed
- [ ] Card can be expanded/collapsed without errors
- [ ] Edit button is visible and clickable

### 2. Authentication & API Connectivity
- [ ] Token is stored in localStorage (authToken or token)
- [ ] API headers include Bearer token
- [ ] Network calls show proper authentication in browser DevTools
- [ ] 401/403 errors are handled gracefully

### 3. Master Data Loading
Test each API endpoint:

#### Business Types API
- [ ] **Endpoint:** `/get-all-business-types`
- [ ] **Expected:** List of business types loads in dropdown
- [ ] **Error handling:** Shows user-friendly message if fails

#### Provinces API
- [ ] **Endpoint:** `/locations`
- [ ] **Expected:** Thailand provinces load in autocomplete
- [ ] **Error handling:** Graceful fallback if loading fails

#### Districts API
- [ ] **Endpoint:** `/locations?province_sort_id={id}`
- [ ] **Expected:** Districts load when province is selected
- [ ] **Behavior:** Previous district/subdistrict selections are cleared
- [ ] **Error handling:** Shows empty list if fails

#### Subdistricts API
- [ ] **Endpoint:** `/locations?district_sort_id={id}`
- [ ] **Expected:** Subdistricts load when district is selected
- [ ] **Error handling:** Shows empty list if fails

### 4. Form Validation
Test each validation rule:

#### Company Name (cus_company)
- [ ] Required field validation
- [ ] Min 2 characters
- [ ] Shows error message for invalid input
- [ ] Error clears when valid input is entered

#### Contact Name (cus_firstname, cus_lastname)
- [ ] At least one name field required
- [ ] Proper error messaging

#### Email (cus_email)
- [ ] Valid email format required
- [ ] Optional field (can be empty)
- [ ] Email format validation works

#### Phone Numbers (cus_tel_1, cus_tel_2)
- [ ] Numbers only validation
- [ ] Automatic formatting (if implemented)
- [ ] At least primary phone required

#### Tax ID (cus_tax_id)
- [ ] 13-digit validation
- [ ] Numbers only
- [ ] Optional field
- [ ] Format validation

#### Address Fields
- [ ] Address text field validation
- [ ] Postal code format validation
- [ ] Location dropdowns work correctly

### 5. User Interface Interactions

#### Edit Mode
- [ ] Click "แก้ไข" button enters edit mode
- [ ] Form expands automatically
- [ ] All fields become editable
- [ ] Cancel and Save buttons appear

#### Form Fields
- [ ] Text inputs work correctly
- [ ] Autocomplete dropdowns function properly
- [ ] Province → District → Subdistrict cascade works
- [ ] Business type dropdown populates

#### Button Actions
- [ ] **Cancel button:** Reverts all changes, exits edit mode
- [ ] **Save button:** Validates form before saving
- [ ] **Save button:** Shows loading state during save
- [ ] **Save button:** Success message appears after save

### 6. Data Persistence

#### Save Customer Updates
- [ ] **Endpoint:** `PUT /customers/{id}`
- [ ] **Expected:** Customer data saved to tnpdb.master_customers
- [ ] **Verification:** Data persists after page refresh
- [ ] **Response:** Success status returned

#### Data Integrity
- [ ] All form fields map correctly to database columns
- [ ] Phone numbers cleaned (numbers only)
- [ ] Tax ID cleaned (numbers only)
- [ ] Location IDs properly stored

### 7. Error Handling

#### Network Errors
- [ ] No internet connection - shows network error message
- [ ] Server down - shows server error message
- [ ] Timeout - shows timeout message

#### API Errors
- [ ] 400 Bad Request - shows validation errors
- [ ] 401 Unauthorized - redirects to login
- [ ] 403 Forbidden - shows permission error
- [ ] 404 Not Found - shows not found error
- [ ] 500 Server Error - shows server error

#### Form Errors
- [ ] Validation errors display correctly
- [ ] Multiple errors can be shown simultaneously
- [ ] Errors clear when fields are corrected
- [ ] Form submission prevented when errors exist

### 8. User Experience

#### Loading States
- [ ] Master data loading indicators
- [ ] Save button loading indicator
- [ ] Proper loading text/spinners

#### Success Feedback
- [ ] Success message after saving
- [ ] Message auto-dismisses after 3 seconds
- [ ] Form exits edit mode after save

#### Responsive Design
- [ ] Works on mobile devices
- [ ] Dropdowns work on touch devices
- [ ] Buttons are properly sized

## 🐛 Common Issues & Solutions

### API 404 Errors
**Problem:** Getting 404 errors with duplicate `/api/v1/` in URLs
**Solution:** Check VITE_END_POINT_URL includes `/api/v1` (should be: `http://localhost:8000/api/v1`)

### Authentication Issues
**Problem:** 401 Unauthorized errors
**Solution:** 
1. Check token exists in localStorage
2. Verify token hasn't expired
3. Ensure token is valid Bearer token

### Location Loading Issues
**Problem:** Districts/subdistricts not loading
**Solution:**
1. Check province_sort_id/district_sort_id values
2. Verify API endpoints return correct data structure
3. Check console for network errors

### Form Validation Not Working
**Problem:** Form submits with invalid data
**Solution:**
1. Check validateCustomerData function
2. Verify validation errors display
3. Ensure form submission is prevented

## 🔧 Debug Tools

### Enable Debug Mode
Add to `.env`:
```
VITE_DEBUG_API=true
```

### Browser DevTools
- **Network tab:** Monitor API calls and responses
- **Console:** Check for error messages and debug logs
- **Application → Local Storage:** Verify token storage

### API Testing
Use browser console to test API functions:
```javascript
// Test business types
customerApi.getBusinessTypes().then(console.log).catch(console.error);

// Test provinces
customerApi.getProvinces().then(console.log).catch(console.error);

// Test customer update
customerApi.updateCustomer(123, {cus_company: 'Test Company'}).then(console.log).catch(console.error);
```

## ✅ Test Completion Criteria

### Basic Functionality
- [ ] All API endpoints work without errors
- [ ] Form validation prevents invalid submissions
- [ ] Customer data saves to database successfully
- [ ] UI provides proper feedback to users

### Advanced Testing
- [ ] Error scenarios handled gracefully
- [ ] Network issues don't crash the application
- [ ] Data integrity maintained through all operations
- [ ] User experience is smooth and intuitive

### Production Readiness
- [ ] No console errors in production build
- [ ] Performance is acceptable
- [ ] All user workflows complete successfully
- [ ] Documentation is complete and accurate

## 📝 Test Report Template

```
# Customer Update System Test Report

**Date:** ___________
**Tester:** ___________
**Environment:** Dev/Staging/Production

## Summary
- Tests Passed: ___/___
- Critical Issues: ___
- Minor Issues: ___

## Detailed Results
### API Connectivity: ✅/❌
### Form Validation: ✅/❌  
### Data Persistence: ✅/❌
### Error Handling: ✅/❌
### User Experience: ✅/❌

## Issues Found
1. _____________
2. _____________

## Recommendations
1. _____________
2. _____________
```

## 🎯 Success Metrics
- **API Response Time:** < 2 seconds
- **Form Validation:** 100% coverage
- **Error Handling:** All scenarios covered
- **User Satisfaction:** Smooth, intuitive workflow
- **Data Integrity:** 100% accurate saves
