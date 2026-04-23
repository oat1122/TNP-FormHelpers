import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  dialogOpen: false,
  selectedNotebook: null,
  dialogMode: "create",
  dialogFocusTarget: null,
  dialogScope: "full",
};

export const notebookSlice = createSlice({
  name: "notebook",
  initialState,
  reducers: {
    setDialogOpen: (state, action) => {
      state.dialogOpen = action.payload;
    },
    setSelectedNotebook: (state, action) => {
      state.selectedNotebook = action.payload;
    },
    setDialogMode: (state, action) => {
      state.dialogMode = action.payload;
    },
    setDialogFocusTarget: (state, action) => {
      state.dialogFocusTarget = action.payload;
    },
    setDialogScope: (state, action) => {
      state.dialogScope = action.payload;
    },
    resetNotebookDialog: (state) => {
      state.dialogOpen = false;
      state.selectedNotebook = null;
      state.dialogMode = "create";
      state.dialogFocusTarget = null;
      state.dialogScope = "full";
    },
  },
});

export const {
  setDialogOpen,
  setSelectedNotebook,
  setDialogMode,
  setDialogFocusTarget,
  setDialogScope,
  resetNotebookDialog,
} = notebookSlice.actions;

export default notebookSlice.reducer;
