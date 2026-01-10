import { createSlice } from "@reduxjs/toolkit";

import initialState from "./customerInitialState";
import reducers from "./customerReducers";
import { customerApi } from "./customerApi";

/**
 * Customer Slice
 *
 * Manages client-side state for Customer feature.
 * API data fetching is handled by RTK Query (customerApi).
 * This slice syncs RTK Query results to Redux state via extraReducers matchers.
 */
export const customerSlice = createSlice({
  name: "customer",
  initialState: {
    ...initialState,
    isLoading: false,
    error: null,
  },
  reducers: {
    ...reducers,
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Auto-sync RTK Query results to Redux state
    // This allows components that rely on Redux state to work seamlessly
    builder.addMatcher(customerApi.endpoints.getAllCustomer.matchPending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addMatcher(
      customerApi.endpoints.getAllCustomer.matchFulfilled,
      (state, { payload }) => {
        // Data is already processed by transformResponse in customerApi.js
        // No need to map data here - just receive the already-processed payload
        state.itemList = payload.data || [];
        state.totalCount = payload.total_count || payload.pagination?.total_items || 0;
        if (payload.groups && Array.isArray(payload.groups)) {
          state.groupList = payload.groups;
        }
        state.isLoading = false;
      }
    );
    builder.addMatcher(customerApi.endpoints.getAllCustomer.matchRejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error?.message || "Failed to fetch customers";
    });
  },
});

// Action creators are generated for each case reducer function
export const {
  setItemList,
  setInputList,
  resetInputList,
  setMode,
  setGroupList,
  setItem,
  setGroupSelected,
  setTotalCount,
  setPaginationModel,
  setSalesList,
  setFilters,
  resetFilters,
  setIsLoading,
  setError,
} = customerSlice.actions;

export default customerSlice.reducer;
