import { createSlice, createSelector } from "@reduxjs/toolkit";

const initialState = {
  // UI State
  activeStep: "pricing", // pricing, quotation, invoice, receipt, delivery
  selectedItems: [],
  filters: {
    dateRange: null,
    status: "all",
    customer: null,
    searchQuery: "",
  },

  // Modal States
  modals: {
    createQuotation: false,
    createInvoice: false,
    createReceipt: false,
    createDelivery: false,
    viewDocument: false,
    approveDocument: false,
    uploadEvidence: false,
  },

  // Form States
  forms: {
    quotation: {
      isSubmitting: false,
      errors: {},
    },
    invoice: {
      isSubmitting: false,
      errors: {},
    },
    receipt: {
      isSubmitting: false,
      errors: {},
    },
    delivery: {
      isSubmitting: false,
      errors: {},
    },
  },

  // Current editing data
  currentDocument: null,
  currentDocumentType: null, // 'quotation', 'invoice', 'receipt', 'delivery'

  // Auto-fill data
  autofillData: null,

  // Dashboard data
  dashboardStats: {
    totalQuotations: 0,
    pendingApprovals: 0,
    completedDeliveries: 0,
    monthlyRevenue: 0,
  },

  // Notifications
  notifications: [],

  // View preferences
  viewMode: "grid", // 'grid' | 'list'
  sortBy: "created_at",
  sortOrder: "desc",
};

const accountingSlice = createSlice({
  name: "accounting",
  initialState,
  reducers: {
    // Navigation
    setActiveStep: (state, action) => {
      state.activeStep = action.payload;
    },

    // Filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    resetFilters: (state) => {
      state.filters = initialState.filters;
    },

    // Selection
    setSelectedItems: (state, action) => {
      state.selectedItems = action.payload;
    },

    toggleItemSelection: (state, action) => {
      const itemId = action.payload;
      const index = state.selectedItems.indexOf(itemId);

      if (index >= 0) {
        state.selectedItems.splice(index, 1);
      } else {
        state.selectedItems.push(itemId);
      }
    },

    clearSelection: (state) => {
      state.selectedItems = [];
    },

    // Modal Management
    openModal: (state, action) => {
      const { modalName, data } = action.payload;
      state.modals[modalName] = true;

      if (data) {
        state.currentDocument = data;
        state.currentDocumentType = modalName
          .replace("create", "")
          .replace("view", "")
          .toLowerCase();
      }
    },

    closeModal: (state, action) => {
      const modalName = action.payload;
      state.modals[modalName] = false;

      // Clear current document when closing modal
      if (modalName.includes("create") || modalName.includes("view")) {
        state.currentDocument = null;
        state.currentDocumentType = null;
      }
    },

    closeAllModals: (state) => {
      Object.keys(state.modals).forEach((key) => {
        state.modals[key] = false;
      });
      state.currentDocument = null;
      state.currentDocumentType = null;
    },

    // Form States
    setFormSubmitting: (state, action) => {
      const { formName, isSubmitting } = action.payload;
      state.forms[formName].isSubmitting = isSubmitting;
    },

    setFormErrors: (state, action) => {
      const { formName, errors } = action.payload;
      state.forms[formName].errors = errors;
    },

    clearFormErrors: (state, action) => {
      const formName = action.payload;
      state.forms[formName].errors = {};
    },

    // Current Document
    setCurrentDocument: (state, action) => {
      const { document, type } = action.payload;
      state.currentDocument = document;
      state.currentDocumentType = type;
    },

    clearCurrentDocument: (state) => {
      state.currentDocument = null;
      state.currentDocumentType = null;
    },

    // Auto-fill
    setAutofillData: (state, action) => {
      state.autofillData = action.payload;
    },

    clearAutofillData: (state) => {
      state.autofillData = null;
    },

    // Dashboard Stats
    setDashboardStats: (state, action) => {
      state.dashboardStats = { ...state.dashboardStats, ...action.payload };
    },

    // Notifications
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      state.notifications.unshift(notification);

      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },

    removeNotification: (state, action) => {
      const id = action.payload;
      state.notifications = state.notifications.filter((n) => n.id !== id);
    },

    clearNotifications: (state) => {
      state.notifications = [];
    },

    markNotificationAsRead: (state, action) => {
      const id = action.payload;
      const notification = state.notifications.find((n) => n.id === id);
      if (notification) {
        notification.read = true;
      }
    },

    // View Preferences
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },

    setSorting: (state, action) => {
      const { sortBy, sortOrder } = action.payload;
      state.sortBy = sortBy;
      state.sortOrder = sortOrder;
    },

    // Bulk Actions
    performBulkAction: (state, action) => {
      const { action: bulkAction, itemIds } = action.payload;

      // Store bulk action state for UI feedback
      state.lastBulkAction = {
        action: bulkAction,
        itemIds,
        timestamp: new Date().toISOString(),
      };
    },

    // Reset State
    resetAccountingState: () => initialState,
  },
});

export const {
  // Navigation
  setActiveStep,

  // Filters
  setFilters,
  resetFilters,

  // Selection
  setSelectedItems,
  toggleItemSelection,
  clearSelection,

  // Modal Management
  openModal,
  closeModal,
  closeAllModals,

  // Form States
  setFormSubmitting,
  setFormErrors,
  clearFormErrors,

  // Current Document
  setCurrentDocument,
  clearCurrentDocument,

  // Auto-fill
  setAutofillData,
  clearAutofillData,

  // Dashboard Stats
  setDashboardStats,

  // Notifications
  addNotification,
  removeNotification,
  clearNotifications,
  markNotificationAsRead,

  // View Preferences
  setViewMode,
  setSorting,

  // Bulk Actions
  performBulkAction,

  // Reset
  resetAccountingState,
} = accountingSlice.actions;

// Selectors
export const selectActiveStep = (state) => state.accounting.activeStep;
export const selectFilters = (state) => state.accounting.filters;
export const selectSelectedItems = (state) => state.accounting.selectedItems;
export const selectModals = (state) => state.accounting.modals;
export const selectForms = (state) => state.accounting.forms;
export const selectCurrentDocument = (state) => state.accounting.currentDocument;
export const selectCurrentDocumentType = (state) => state.accounting.currentDocumentType;
export const selectAutofillData = (state) => state.accounting.autofillData;
export const selectDashboardStats = (state) => state.accounting.dashboardStats;
export const selectNotifications = (state) => state.accounting.notifications;
export const selectUnreadNotifications = createSelector(
  (state) => state.accounting.notifications,
  (notifications) => notifications.filter((n) => !n.read)
);
export const selectViewMode = (state) => state.accounting.viewMode;
export const selectSorting = createSelector(
  (state) => state.accounting.sortBy,
  (state) => state.accounting.sortOrder,
  (sortBy, sortOrder) => ({ sortBy, sortOrder })
);

export default accountingSlice.reducer;
