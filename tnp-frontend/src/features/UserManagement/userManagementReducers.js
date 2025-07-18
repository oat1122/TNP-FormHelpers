import { v4 as uuid } from "uuid";

const user = JSON.parse(localStorage.getItem("userData"));

export default {
  setItemList: (state, action) => {
    state.itemList = action.payload;
  },
  setGroupList: (state, action) => {
    state.groupList = action.payload;
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
  setGroupSelected: (state, action) => {
    state.groupSelected = action.payload;
  },
  setTotalCount: (state, action) => {
    state.totalCount = action.payload;
  },
  resetInputList: (state) => {
    state.inputList = {
      cus_id: uuid(),
      cus_mcg_id: "",
      cus_no: "",
      cus_channel: "",
      cus_firstname: "",
      cus_lastname: "",
      cus_name: "",
      cus_depart: "",
      cus_company: "",
      cus_tel_1: "",
      cus_tel_2: "",
      cus_email: "",
      cus_tax_id: "",
      cus_pro_id: "",
      cus_dis_id: "",
      cus_sub_id: "",
      cus_zip_code: "",
      cus_address: "",
      cus_manage_by: "",
      cus_created_by: "",
      cus_created_date: "",
      cus_updated_by: "",
      cus_updated_date: "",
      cus_is_use: true,
      cd_id: uuid(),
      cd_last_datetime: "",
      cd_note: "",
      cd_remark: "",
    };
  },
};