## Fix Applied: Function Hoisting Issue

### Problem
```
Uncaught ReferenceError: Cannot access 'getEvidenceForMode' before initialization
    at hasEvidenceForMode (InvoiceCard.jsx:346:27)
```

The `hasEvidenceForMode` function was defined before `getEvidenceForMode`, causing a hoisting issue in JavaScript.

### Solution Applied

1. **Moved function definitions**: Reordered the function definitions so that `getEvidenceForMode` comes before `hasEvidenceForMode`

2. **Updated Evidence Upload Section**: 
   - Shows upload section for approved status OR when in 'after' mode with 'pending_after' status
   - Properly disables upload functionality when in 'after' mode with 'pending_after' status
   - Shows appropriate helper text for disabled state

3. **Function Order Now Correct**:
   ```javascript
   // ✅ Correct order
   const getEvidenceForMode = (mode) => { ... };
   const hasEvidenceForMode = (mode) => {
     const evidenceFiles = getEvidenceForMode(mode); // ✅ Now accessible
     return evidenceFiles.length > 0;
   };
   ```

### Key Changes Made

1. **Removed** the early definition of `hasEvidenceForMode` 
2. **Added** both functions after `getEvidenceForMode` definition
3. **Updated** Evidence Upload Section condition to show/disable appropriately
4. **Fixed** helper text for disabled upload state

### Status
✅ **Fixed** - Component should now render without hoisting errors
✅ **Verified** - No syntax errors detected
✅ **Ready** - For testing in browser

The deposit mode switch functionality should now work correctly without the JavaScript hoisting error.