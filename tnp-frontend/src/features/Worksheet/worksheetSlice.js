import { createSlice } from "@reduxjs/toolkit";
import initialState from "./worksheetInitialState";
import reducers from "./worksheetReducers";

export const worksheetSlice = createSlice({
  name: "worksheet",
  initialState,
  reducers,
});

// Action creators are generated for each case reducer function
export const {
  setItemList,
  setItem,
  setCustomerList,
  setCustomerSelected,
  setInputList,
  setDateInput,
  setRadioSelect,
  setExtraSizes,
  setIsEdit,
  setPoloChecked,
  setUserList,
  setIsDuplicate,
  setErrorMsg,
  setInputPattern,
  setInputExample,
  resetInputList,
  addRowFabricCustomColor,
  deleteRowFabricCustomColor,
  addRowPoloEmbroider,
  deleteRowPoloEmbroider,
  addExtraSize,
  deleteRowPatternSize,
} = worksheetSlice.actions;

export default worksheetSlice.reducer;
