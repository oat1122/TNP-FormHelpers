import { useState, useCallback, useMemo } from "react";

/**
 * Generic Advanced Filter Hook
 * ใช้สำหรับจัดการ Filter ใดๆ ที่ระบุใน configuration
 * 
 * @param {Object} config - Configuration object
 * @param {Object} config.initialFilters - ค่าเริ่มต้นของ filters
 * @param {Array} config.filterFields - รายการ filter fields ที่ต้องการ
 * @param {Object} config.customHandlers - Custom handlers สำหรับ fields เฉพาะ
 * @returns {Object} { filters, handlers, getQueryArgs }
 * 
 * @example
 * // สำหรับ Invoices
 * const { filters, handlers, getQueryArgs } = useAdvancedFilter({
 *   filterFields: ['search', 'status', 'statusBefore', 'statusAfter', 'dateRange'],
 *   initialFilters: { status: 'all' }
 * });
 * 
 * // สำหรับ Quotations
 * const { filters, handlers, getQueryArgs } = useAdvancedFilter({
 *   filterFields: ['search', 'status', 'dateRange'],
 *   initialFilters: { status: 'pending' }
 * });
 */
export const useAdvancedFilterGeneric = (config = {}) => {
  const {
    initialFilters = {},
    filterFields = ['search', 'status', 'dateRange'],
    customHandlers = {},
  } = config;

  // สร้าง initial state สำหรับแต่ละ field
  const getInitialValue = (field) => {
    if (initialFilters[field] !== undefined) {
      return initialFilters[field];
    }
    
    // Default values ตามประเภทของ field
    if (field === 'dateRange') return [null, null];
    if (field.toLowerCase().includes('status')) return 'all';
    if (field === 'search' || field === 'searchQuery') return '';
    
    return '';
  };

  // สร้าง state สำหรับทุก field
  const [filterState, setFilterState] = useState(() => {
    const state = {};
    filterFields.forEach(field => {
      state[field] = getInitialValue(field);
    });
    return state;
  });

  /**
   * Generic handler สำหรับ text/select fields
   */
  const createFieldHandler = useCallback((fieldName) => {
    return (e) => {
      const value = e.target ? e.target.value : e;
      setFilterState(prev => ({ ...prev, [fieldName]: value }));
    };
  }, []);

  /**
   * Handler สำหรับ date range
   */
  const handleDateRangeChange = useCallback((newDateRange) => {
    setFilterState(prev => ({ ...prev, dateRange: newDateRange }));
  }, []);

  /**
   * Handler สำหรับ statusBefore (with mutual exclusivity)
   */
  const handleStatusBeforeChange = useCallback((e) => {
    const newValue = e.target.value;
    setFilterState(prev => ({
      ...prev,
      statusBefore: newValue,
      // รีเซ็ต statusAfter เมื่อเลือก statusBefore
      statusAfter: newValue !== 'all' ? 'all' : prev.statusAfter
    }));
  }, []);

  /**
   * Handler สำหรับ statusAfter (with mutual exclusivity)
   */
  const handleStatusAfterChange = useCallback((e) => {
    const newValue = e.target.value;
    setFilterState(prev => ({
      ...prev,
      statusAfter: newValue,
      // รีเซ็ต statusBefore เมื่อเลือก statusAfter
      statusBefore: newValue !== 'all' ? 'all' : prev.statusBefore
    }));
  }, []);

  /**
   * Reset ทุก filters
   */
  const resetFilters = useCallback(() => {
    const resetState = {};
    filterFields.forEach(field => {
      resetState[field] = getInitialValue(field);
    });
    setFilterState(resetState);
  }, [filterFields, initialFilters]);

  /**
   * สร้าง handlers object
   */
  const handlers = useMemo(() => {
    const h = {};
    
    filterFields.forEach(field => {
      // ใช้ custom handler ถ้ามี
      if (customHandlers[field]) {
        h[`handle${capitalize(field)}Change`] = customHandlers[field];
        return;
      }

      // Special cases
      if (field === 'dateRange') {
        h.handleDateRangeChange = handleDateRangeChange;
      } else if (field === 'statusBefore') {
        h.handleStatusBeforeChange = handleStatusBeforeChange;
      } else if (field === 'statusAfter') {
        h.handleStatusAfterChange = handleStatusAfterChange;
      } else {
        // Generic handler
        h[`handle${capitalize(field)}Change`] = createFieldHandler(field);
      }
    });

    h.resetFilters = resetFilters;
    
    return h;
  }, [
    filterFields,
    customHandlers,
    createFieldHandler,
    handleDateRangeChange,
    handleStatusBeforeChange,
    handleStatusAfterChange,
    resetFilters
  ]);

  /**
   * แปลง filter state เป็น query args สำหรับ API
   */
  const getQueryArgs = useCallback(() => {
    const args = {};

    filterFields.forEach(field => {
      const value = filterState[field];

      // Handle different field types
      if (field === 'dateRange') {
        if (value && value[0]) {
          args.start_date = value[0].toISOString().split('T')[0];
        }
        if (value && value[1]) {
          args.end_date = value[1].toISOString().split('T')[0];
        }
      } else if (field === 'search' || field === 'searchQuery') {
        if (value && value.trim()) {
          args.search = value;
        }
      } else if (field.toLowerCase().includes('status')) {
        if (value && value !== 'all') {
          // แปลง field name เป็น snake_case
          const snakeField = toSnakeCase(field);
          args[snakeField] = value;
        }
      } else {
        // Generic fields
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          const snakeField = toSnakeCase(field);
          args[snakeField] = value;
        }
      }
    });

    return args;
  }, [filterState, filterFields]);

  return {
    filters: filterState,
    handlers,
    getQueryArgs,
  };
};

/**
 * Helper: Capitalize first letter
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Helper: Convert camelCase to snake_case
 */
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export default useAdvancedFilterGeneric;
