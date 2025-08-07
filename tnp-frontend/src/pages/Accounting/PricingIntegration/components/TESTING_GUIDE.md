# 🧪 Customer Update System - Testing Guide

## 🎯 How to Test the Customer Update System

### Prerequisites
1. ✅ Backend server running on correct URL
2. ✅ Authentication token available in localStorage
3. ✅ Customer data from pricing request loaded

### Test Scenarios

#### 📋 Test 1: Load Master Data
```javascript
// Expected API calls when component loads:
GET /api/v1/get-all-business-types
GET /api/v1/locations

// Check console for successful data loading
console.log('Business Types:', businessTypes);
console.log('Provinces:', provinces);
```

#### 📋 Test 2: Customer Data Display
- ✅ Customer company name displays correctly
- ✅ Phone number formats with dashes (xxx-xxx-xxxx)
- ✅ Tax ID formats with dashes (x-xxxx-xxxxx-xx-x)
- ✅ Expand/collapse functionality works

#### 📋 Test 3: Edit Mode Activation
- ✅ Click edit button (✏️) to enter edit mode
- ✅ All fields become editable
- ✅ Save/Cancel buttons appear
- ✅ Form validation activates

#### 📋 Test 4: Form Validation
Test these validation rules:
- ❌ Empty required fields (company, firstname, lastname, nickname, phone)
- ❌ Invalid phone number format
- ❌ Invalid email format
- ❌ Invalid tax ID (not 13 digits)

#### 📋 Test 5: Location Cascade
1. Select a province → districts should load
2. Select a district → subdistricts should load
3. Select a subdistrict → zip code should auto-fill

#### 📋 Test 6: Save Customer Data
```javascript
// Expected API call when saving:
PUT /api/v1/customers/{customer_id}
{
  "cus_company": "บริษัท ทดสอบ จำกัด",
  "cus_firstname": "สมชาย",
  "cus_lastname": "ใจดี",
  // ... other fields
}
```

### 🐛 Common Issues & Solutions

#### Issue 1: API 404 Errors
```
❌ Failed to load resource: the server responded with a status of 404
```
**Solution**: Check if backend routes are properly configured:
- `/api/v1/get-all-business-types`
- `/api/v1/locations`
- `/api/v1/customers/{id}`

#### Issue 2: Authentication Errors
```
❌ Error: Unauthorized
```
**Solution**: Check authentication token:
```javascript
// Check token in browser console
console.log('Auth Token:', localStorage.getItem('authToken'));
console.log('Token:', localStorage.getItem('token'));
```

#### Issue 3: CORS Errors
```
❌ Access to fetch at '...' has been blocked by CORS policy
```
**Solution**: Configure CORS in Laravel backend or use proper base URL.

#### Issue 4: Data Not Loading
**Check these steps**:
1. Network tab for API calls
2. Console for error messages
3. Backend logs for API errors
4. Database connection

### 🔧 Debug Tools

#### Debug Customer Data Loading
```javascript
// Add to CreateQuotationForm.jsx
console.log('🔍 Customer data in form:', formData.customer);
console.log('📋 Customer keys:', Object.keys(formData.customer || {}));
```

#### Debug API Responses
```javascript
// Add to customerApiUtils.js
console.log('📡 API Response:', response);
console.log('📦 Response data:', data);
```

#### Debug Form Validation
```javascript
// Add to CustomerEditCard.jsx
console.log('✅ Validation result:', validation);
console.log('❌ Validation errors:', validation.errors);
```

### 📊 Performance Testing

#### Load Time Benchmarks
- Master data loading: < 2 seconds
- Customer update: < 1 second
- Province/District cascade: < 500ms

#### Memory Usage
- Component should not cause memory leaks
- Event listeners properly cleaned up
- API calls cancelled when component unmounts

### 🎨 UI/UX Testing

#### Responsive Design
- ✅ Desktop (1200px+): Full layout
- ✅ Tablet (768-1199px): Responsive layout
- ✅ Mobile (<768px): Stacked layout

#### Accessibility
- ✅ Keyboard navigation
- ✅ Screen reader compatibility
- ✅ Color contrast compliance
- ✅ Focus indicators

#### Visual States
- ✅ Loading indicators during API calls
- ✅ Success messages after save
- ✅ Error messages for validation/API errors
- ✅ Disabled states during processing

### 📝 Manual Test Checklist

#### Basic Functionality
- [ ] Component loads without errors
- [ ] Master data loads successfully
- [ ] Customer data displays correctly
- [ ] Edit mode can be activated
- [ ] Form validation works
- [ ] Customer data can be saved
- [ ] Success/error messages display

#### Edge Cases
- [ ] No customer data provided
- [ ] Invalid customer data format
- [ ] Network connection issues
- [ ] Server errors (500, 503)
- [ ] Authentication token expiry
- [ ] Large datasets performance

#### User Experience
- [ ] Smooth animations and transitions
- [ ] Intuitive button placements
- [ ] Clear error messages
- [ ] Responsive design works
- [ ] Loading states are informative

### 🚀 Production Deployment Checklist

#### Code Quality
- [ ] All console.log removed from production
- [ ] Error handling comprehensive
- [ ] Loading states implemented
- [ ] Memory leaks prevented

#### Security
- [ ] API endpoints properly secured
- [ ] Input validation on both client/server
- [ ] Authentication tokens handled securely
- [ ] SQL injection prevention

#### Performance
- [ ] API responses optimized
- [ ] Component rendering optimized
- [ ] Image assets optimized
- [ ] Bundle size optimized

---

## 🎉 Success Criteria

The Customer Update System is working correctly when:

1. ✅ All master data loads without errors
2. ✅ Customer information displays and formats correctly
3. ✅ Edit mode allows data modification
4. ✅ Form validation prevents invalid submissions
5. ✅ Customer data saves successfully to database
6. ✅ UI provides clear feedback for all actions
7. ✅ System handles errors gracefully
8. ✅ Performance meets benchmark requirements

---

**Happy Testing! 🧪**
