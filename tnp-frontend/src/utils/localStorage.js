/**
 * Utility functions for managing localStorage in the Customer List component
 */

/**
 * Clear all customer table preferences from localStorage
 * This function can be called to reset all column preferences to default
 */
export const clearCustomerTablePreferences = () => {
  try {
    localStorage.removeItem("customerTableColumnVisibility");
    localStorage.removeItem("customerTableColumnOrder");
    console.log("Customer table preferences cleared successfully");
    return true;
  } catch (error) {
    console.error("Failed to clear customer table preferences:", error);
    return false;
  }
};

/**
 * Check if localStorage contains valid customer table preferences
 * @returns {object} Status of localStorage preferences
 */
export const validateCustomerTablePreferences = () => {
  const result = {
    columnVisibility: { exists: false, valid: false },
    columnOrder: { exists: false, valid: false },
  };

  try {
    // Check column visibility preferences
    const savedVisibility = localStorage.getItem("customerTableColumnVisibility");
    if (savedVisibility) {
      result.columnVisibility.exists = true;
      const parsed = JSON.parse(savedVisibility);
      const requiredColumns = ['cus_channel', 'cd_note', 'business_type'];
      result.columnVisibility.valid = requiredColumns.every(col => col in parsed.model);
    }

    // Check column order preferences
    const savedOrder = localStorage.getItem("customerTableColumnOrder");
    if (savedOrder) {
      result.columnOrder.exists = true;
      const parsed = JSON.parse(savedOrder);
      const requiredColumns = ['cus_channel', 'cd_note', 'business_type'];
      result.columnOrder.valid = requiredColumns.every(col => parsed.order.includes(col));
    }
  } catch (error) {
    console.error("Error validating localStorage preferences:", error);
  }

  return result;
};

/**
 * Export current customer table preferences for backup
 * @returns {object|null} Current preferences or null if error
 */
export const exportCustomerTablePreferences = () => {
  try {
    const visibility = localStorage.getItem("customerTableColumnVisibility");
    const order = localStorage.getItem("customerTableColumnOrder");
    
    return {
      columnVisibility: visibility ? JSON.parse(visibility) : null,
      columnOrder: order ? JSON.parse(order) : null,
      exportDate: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to export customer table preferences:", error);
    return null;
  }
};

/**
 * Import customer table preferences from backup
 * @param {object} preferences - Preferences object from exportCustomerTablePreferences
 * @returns {boolean} Success status
 */
export const importCustomerTablePreferences = (preferences) => {
  try {
    if (preferences.columnVisibility) {
      localStorage.setItem(
        "customerTableColumnVisibility",
        JSON.stringify(preferences.columnVisibility)
      );
    }
    
    if (preferences.columnOrder) {
      localStorage.setItem(
        "customerTableColumnOrder",
        JSON.stringify(preferences.columnOrder)
      );
    }
    
    console.log("Customer table preferences imported successfully");
    return true;
  } catch (error) {
    console.error("Failed to import customer table preferences:", error);
    return false;
  }
};
