import { createSlice } from "@reduxjs/toolkit";
import initialState from "./customerInitialState";
import reducers from "./customerReducers";

export const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers,
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
} = customerSlice.actions;

export default customerSlice.reducer;
