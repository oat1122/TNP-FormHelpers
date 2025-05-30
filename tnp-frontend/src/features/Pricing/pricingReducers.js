import { v4 as uuid } from "uuid";

const user = JSON.parse(localStorage.getItem("userData"));

export default {
  setItemList: (state, action) => {
    state.itemList = action.payload;
  },
  setStatusList: (state, action) => {
    state.statusList = action.payload;
  },
  setInputList: (state, action) => {
    state.inputList = action.payload;
  },
  setMode: (state, action) => {
    state.mode = action.payload;
  },
  setItem: (state, action) => {
    state.inputList = action.payload;
  },
  setStatusSelected: (state, action) => {
    state.statusSelected = action.payload;
  },
  setTotalCount: (state, action) => {
    state.totalCount = action.payload;
  },
  setPaginationModel: (state, action) => {
    state.paginationModel = action.payload;
  },
  setNote: (state, action) => {
    const keyMap = {
      'sales': 'note_sales',
      'price': 'note_price',
      'manager': 'note_manager',
    }
    
    const { inputData, noteType } = action.payload;

    state.inputList[keyMap[noteType]].push(inputData);
  },
  resetInputList: (state) => {
    state.inputList = {
      pr_mpc_id: "",
      pr_cus_id: "",
      pr_work_name: "",
      pr_pattern: "",
      pr_fabric_type: "",
      pr_color: "",
      pr_sizes: "",
      pr_quantity: "",
      pr_due_date: null,
      pr_silk: "",
      pr_dft: "",
      pr_embroider: "",
      pr_sub: "",
      pr_other_screen: "",
      pr_image: "",
      pr_created_date: null,
      pr_created_by: "",
      pr_updated_date: null,
      pr_updated_by: "",

      // customer section
      cus_company: "",
      cus_name: "",
      cus_tel_1: "",
      cus_email: "",
      cus_fullname: "",  // cus_firstname + cus_lastname;

      // note pricing
      note_sales: [],
      note_price: [],
      note_manager: [],
    };
  },
  setImagePreviewForm: (state, action) => {
    state.imagePreview = action.payload;
  },
};