import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import initialState from "./customerInitialState";
import reducers from "./customerReducers";
import { apiConfig } from "../../api/apiConfig";
import qs from "qs";

// Define the async thunk for fetching filtered customers
export const fetchFilteredCustomers = createAsyncThunk(
  "customer/fetchFiltered",
  async (filters, { dispatch, getState, rejectWithValue }) => {
    try {
      dispatch(setIsLoading(true));

      const state = getState();
      const groupSelected = state.customer.groupSelected;
      const userData = JSON.parse(localStorage.getItem("userData"));      // Prepare query parameters
      const queryParams = {
        group: groupSelected !== "all" ? groupSelected : undefined,
        user: userData?.user_id,
      };
      
      console.log(`Fetching customers for group: ${groupSelected}, with filters:`, filters);

      // Date Range
      if (filters.dateRange.startDate) {
        queryParams.start_date = filters.dateRange.startDate;
      }
      if (filters.dateRange.endDate) {
        queryParams.end_date = filters.dateRange.endDate;
      }

      // Sales Name filter
      if (Array.isArray(filters.salesName) && filters.salesName.length > 0) {
        queryParams.sales_names = filters.salesName.join(",");
      }
      // Channel filter
      if (Array.isArray(filters.channel) && filters.channel.length > 0) {
        queryParams.channels = filters.channel.join(",");
      }
      
      // Get pagination settings from current state
      const paginationModel = state.customer.paginationModel;
      queryParams.page = paginationModel.page + 1; // Convert 0-indexed to 1-indexed for API
      queryParams.per_page = paginationModel.pageSize;

      const queryString = qs.stringify(queryParams, { skipNulls: true });
      const url = `${apiConfig.baseUrl}/customers?${queryString}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch filtered customers");
      }

      const data = await response.json();
      
      // Ensure each row has a unique ID to prevent MissingRowIdError
      const processedData = Array.isArray(data.data) ? data.data.map(row => {
        // If the row doesn't have a cus_id, generate one
        if (!row.cus_id) {
          return { ...row, cus_id: `row-${Math.random().toString(36).substring(2, 15)}` };
        }
        return row;
      }) : [];      // Update the item list with the filtered results
      dispatch(setItemList(processedData));

      // Check if we have total_count in the response or use pagination total
      if (data.total_count) {
        dispatch(setTotalCount(data.total_count));
      } else if (data.pagination?.total_items) {
        dispatch(setTotalCount(data.pagination.total_items));
      }
      
      // ถ้ามี groups ในการตอบกลับ ให้อัพเดทค่ากลุ่มลูกค้าด้วย
      // แต่ถ้าเป็นการกรองแบบที่ไม่ได้ส่ง group ใหม่มาด้วย 
      // ให้คงค่ากลุ่มเดิมไว้ เพื่อให้ FilterTab คำนวณจำนวนใหม่จาก itemList
      if (data.groups && Array.isArray(data.groups)) {
        dispatch(setGroupList(data.groups));
      }

      return data;
    } catch (error) {
      console.error("Error fetching filtered customers:", error);
      return rejectWithValue(error.message);
    } finally {
      dispatch(setIsLoading(false));
    }
  }
);

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
    builder
      .addCase(fetchFilteredCustomers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFilteredCustomers.fulfilled, (state, action) => {
        state.isLoading = false;
        // The actual data handling is done in the thunk itself
      })
      .addCase(fetchFilteredCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch filtered customers";
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
