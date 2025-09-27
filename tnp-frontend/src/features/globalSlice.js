import { createSlice } from "@reduxjs/toolkit";

export const globalSlice = createSlice({
  name: "global",
  initialState: {
    keyword: "",
    locationSearch: {
      province_sort_id: "",
      district_sort_id: "",
    },
    customerList: [],
    statusList: [],
  },
  reducers: {
    searchKeyword: (state, action) => {
      state.keyword = action.payload;
    },
    setLocationSearch: (state, action) => {
      state.locationSearch = action.payload;
    },
    setCustomerList: (state, action) => {
      const { data } = action.payload;
      state.customerList = data;
    },
    setStatusList: (state, action) => {
      state.statusList = action.payload;
    },
  },
});

export const { searchKeyword, setLocationSearch, setCustomerList, setStatusList } =
  globalSlice.actions;

export default globalSlice.reducer;
