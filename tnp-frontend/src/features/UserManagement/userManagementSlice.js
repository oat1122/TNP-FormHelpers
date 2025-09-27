import { createSlice } from "@reduxjs/toolkit";

import initialState from "./userManagementInitialState";
import reducers from "./userManagementReducers";

export const userManagementSlice = createSlice({
  name: "userManagement",
  initialState,
  reducers,
});

// Action creators are generated for each case reducer function
export const {
  setItemList,
  setInputList,
  resetInputList,
  setMode,
  // setGroupList,
  setItem,
  // setGroupSelected,
  setTotalCount,
} = userManagementSlice.actions;

export default userManagementSlice.reducer;
