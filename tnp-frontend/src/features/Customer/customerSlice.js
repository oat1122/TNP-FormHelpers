import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  item: [],
  itemList: [],
  groupList: [],
  groupSelected: "all",
  paginationModel: { pageSize: 30, page: 0 }, // Default 30 rows
  inputList: {
    cus_mcg_id: "",
    cus_no: "",
    cus_channel: "",
    cus_firstname: "",
    cus_lastname: "",
    cus_name: "",
    cus_depart: "",
    cus_company: "",
    cus_tel_1: "",
    cus_tel_2: "",
    cus_email: "",
    cus_tax_id: "",
    cus_pro_id: "",
    cus_dis_id: "",
    cus_sub_id: "",
    cus_zip_code: "",
    cus_address: "",
    cus_manage_by: "",
    cus_is_use: true,
    cd_last_datetime: "",
    cd_note: "",
    cd_remark: "",
  },
  mode: "",
  totalCount: 0,
  filters: {
    dateRange: {
      startDate: null,
      endDate: null,
    },
    salesName: [], // Changed to array for multi-select
    channel: [], // Changed to array for multi-select
    recallRange: {
      minDays: null,
      maxDays: null,
    },
  },
  salesList: [],
  channelList: [
    { value: "", label: "ทั้งหมด" },
    { value: "1", label: "Sales" },
    { value: "2", label: "Online" },
    { value: "3", label: "Office" },
    { value: "4", label: "Mobile" },
    { value: "5", label: "Email" },
  ],
};

const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    setItemList: (state, action) => {
      state.itemList = action.payload;
    },
    setGroupList: (state, action) => {
      state.groupList = action.payload;
    },
    setInputList: (state, action) => {
      state.inputList = action.payload;
    },
    setMode: (state, action) => {
      state.mode = action.payload;
    },
    setItem: (state, action) => {
      state.inputList = action.payload;
    },
    setGroupSelected: (state, action) => {
      state.groupSelected = action.payload;
    },
    setTotalCount: (state, action) => {
      state.totalCount = action.payload;
    },
    setPaginationModel: (state, action) => {
      state.paginationModel = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setDateRange: (state, action) => {
      state.filters.dateRange = action.payload;
    },
    setSalesName: (state, action) => {
      state.filters.salesName = action.payload;
    },
    setChannel: (state, action) => {
      state.filters.channel = action.payload;
    },
    setRecallRange: (state, action) => {
      state.filters.recallRange = action.payload;
    },
    resetFilters: (state) => {
      state.filters = {
        dateRange: {
          startDate: null,
          endDate: null,
        },
        salesName: [],
        channel: [],
        recallRange: {
          minDays: null,
          maxDays: null,
        },
      };
    },
    setSalesList: (state, action) => {
      state.salesList = action.payload;
    },
    resetInputList: (state) => {
      state.inputList = {
        cus_mcg_id: "",
        cus_no: "",
        cus_channel: "",
        cus_firstname: "",
        cus_lastname: "",
        cus_name: "",
        cus_depart: "",
        cus_company: "",
        cus_tel_1: "",
        cus_tel_2: "",
        cus_email: "",
        cus_tax_id: "",
        cus_pro_id: "",
        cus_dis_id: "",
        cus_sub_id: "",
        cus_zip_code: "",
        cus_address: "",
        cus_manage_by: "",
        cus_is_use: true,
        cd_last_datetime: "",
        cd_note: "",
        cd_remark: "",
      };
    },
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
  setFilters,
  setDateRange,
  setSalesName,
  setChannel,
  setRecallRange,
  resetFilters,
  setSalesList,
} = customerSlice.actions;

export default customerSlice.reducer;