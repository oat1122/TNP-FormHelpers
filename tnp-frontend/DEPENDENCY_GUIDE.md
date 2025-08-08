# 📦 Dependency Management Guide

## 🚨 Current Issues & Solutions

### MUI Version Conflict
- **Issue**: @mui/x-data-grid@7.25.0 requires @mui/material@^5.15.14 || ^6.0.0
- **Project**: Uses @mui/material@^7.2.0  
- **Impact**: Cannot install prop-types due to peer dependency conflicts

### ✅ Recommended Solutions

1. **Use JSDoc instead of PropTypes**
   ```javascript
   /**
    * @param {Object} props.group - ข้อมูลกลุ่ม pricing requests
    * @param {Function} props.onCreateQuotation - ฟังก์ชันสำหรับสร้างใบเสนอราคา
    */
   ```

2. **Install conflicting packages with legacy peer deps**
   ```bash
   npm install package-name --legacy-peer-deps
   ```

3. **Consider upgrading/downgrading MUI versions**
   ```bash
   # Option 1: Downgrade MUI to v6
   npm install @mui/material@^6.0.0 @mui/icons-material@^6.0.0

   # Option 2: Wait for @mui/x-data-grid to support MUI v7
   ```

## 🎯 Project Standards

### Type Safety
- ✅ Use JSDoc comments for type documentation
- ✅ Use TypeScript for new components (if needed)
- ❌ Avoid PropTypes due to dependency conflicts

### Performance
- ✅ Use React.memo for expensive components
- ✅ Implement proper key props in lists
- ✅ Use useMemo/useCallback for expensive computations

### Code Organization
- ✅ Separate helper functions
- ✅ Use meaningful comments with emojis
- ✅ Follow consistent naming conventions

---

**Maintainer**: แต้ม (Fullstack Developer)  
**Last Updated**: August 2025
