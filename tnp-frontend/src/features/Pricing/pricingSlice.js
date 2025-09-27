import { createSlice } from "@reduxjs/toolkit";

import initialState from "./pricingInitialState";
import reducers from "./pricingReducers";

export const pricingSlice = createSlice({
  name: "pricing",
  initialState,
  reducers,
});

// Action creators are generated for each case reducer function
export const {
  setItemList,
  setInputList,
  resetInputList,
  setMode,
  setStatusList,
  setStatusSelected,
  setItem,
  setTotalCount,
  setPaginationModel,
  setNote,
  setImagePreviewForm,
} = pricingSlice.actions;

export default pricingSlice.reducer;
