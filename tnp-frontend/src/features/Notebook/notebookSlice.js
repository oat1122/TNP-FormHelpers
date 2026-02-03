import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  dialogOpen: false,
  selectedNotebook: null, // For edit/convert
  dialogMode: "create", // create, edit, view

  // Form input state (for maintaining state while typing)
  inputData: {
    nb_date: new Date().toISOString().split("T")[0],
    nb_time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    nb_customer_name: "",
    nb_is_online: false,
    nb_additional_info: "",
    nb_contact_number: "",
    nb_email: "",
    nb_contact_person: "",
    nb_action: "",
    nb_status: "",
    nb_remarks: "",
    nb_manage_by: null,
  },
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
    setInputData: (state, action) => {
      state.inputData = action.payload;
    },
    updateInputData: (state, action) => {
      state.inputData = { ...state.inputData, ...action.payload };
    },
    resetForm: (state) => {
      state.inputData = initialState.inputData;
      state.selectedNotebook = null;
      state.dialogMode = "create";
    },
  },
});

export const {
  setDialogOpen,
  setSelectedNotebook,
  setDialogMode,
  setInputData,
  updateInputData,
  resetForm,
} = notebookSlice.actions;

export default notebookSlice.reducer;
