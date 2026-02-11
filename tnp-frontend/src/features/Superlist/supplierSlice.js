import { createSlice } from "@reduxjs/toolkit";

import initialState from "./supplierInitialState";
import reducers from "./supplierReducers";

export const supplierSlice = createSlice({
  name: "supplier",
  initialState,
  reducers,
});

export const {
  setProductList,
  setTagList,
  setSelectedProduct,
  setPaginationModel,
  setTotalCount,
  setFilters,
  resetFilters,
  setInputForm,
  updateInputField,
  resetInputForm,
  setMode,
} = supplierSlice.actions;

export default supplierSlice.reducer;
