import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  itemList: [],
  mode: "", // "create", "edit", "view"
  inputList: {
    msr_id: "",
    msr_code: "",
    msr_name: "",
    msr_description: "",
    msr_is_active: true,
    msr_sort: 0,
  },
};

export const subRoleManagementSlice = createSlice({
  name: "subRoleManagement",
  initialState,
  reducers: {
    setItemList: (state, action) => {
      state.itemList = action.payload;
    },
    setMode: (state, action) => {
      state.mode = action.payload;
    },
    resetInputList: (state) => {
      state.inputList = initialState.inputList;
    },
  },
});

export const { setItemList, setMode, resetInputList } = subRoleManagementSlice.actions;

export default subRoleManagementSlice.reducer;
