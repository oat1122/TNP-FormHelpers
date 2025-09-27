import { createSlice } from "@reduxjs/toolkit";

export const monitorProductionSlice = createSlice({
  name: "monitorProduction",
  initialState: {
    items: [],
    note: [],
    note_lists: [],
    user: JSON.parse(localStorage.getItem("userData")),
  },
  reducers: {
    setItemList: (state, action) => {
      state.items = action.payload;
    },
    setNoteList: (state, action) => {
      state.note_lists = action.payload;
    },
    setNote: (state, action) => {
      state.note = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  setItemList,
  // searchKeyword,
  setNoteList,
  setNote,
} = monitorProductionSlice.actions;

export default monitorProductionSlice.reducer;
