import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  dialogOpen: false,
  selectedNotebook: null,
  dialogMode: "create",
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
    resetNotebookDialog: (state) => {
      state.dialogOpen = false;
      state.selectedNotebook = null;
      state.dialogMode = "create";
    },
  },
});

export const { setDialogOpen, setSelectedNotebook, setDialogMode, resetNotebookDialog } =
  notebookSlice.actions;

export default notebookSlice.reducer;
