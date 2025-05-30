import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { tnpApi } from "../../services/tnpApi";

export const submitForm = createAsyncThunk('fabricCost/submitForm', async (fabrics, { rejectWithValue }) => {
  try {
    const response = await tnpApi.endpoints.editFabricById(fabrics)
    return response.data.message;
  } catch (error) {
    return rejectWithValue(error.response.data.message);
  }
});

export const fabricCostSlice = createSlice({
  name: "fabricCost",
  initialState: {
    pattern: {
      id: 1,
      shirtCate: 0
    },
    fabrics: [],
    user: JSON.parse(localStorage.getItem("userData")),
  },
  reducers: {
    setPatternByID: (state, action) => {
      state.pattern = action.payload;
    },
    setFabricsList: (state, action) => {
      state.fabrics = action.payload;
    },
    updateFabric: (state, action) => {
      const { index, name, value } = action.payload;
      state.fabrics[index][name] = value;
    },
    addFabric: (state) => {
      state.fabrics.push({
        pattern_id: state.pattern.id,
        fabric_class: "R",
        fabric_name: "",
        supplier: "",
        fabric_name_tnp: "",
        fabric_kg: "",
        fabric_price_per_kg: "",
        shirt_per_total: "",
        cutting_price: "",
        sewing_price: "",
        collar_kg: "",
        collar_price: "",
        button_price: "",
        shirt_price_percent: "",
        shirt_1k_price_percent: "",
        profit_percent: 0,
      });
    },
    removeFabric: (state, action) => {
      state.fabrics.splice(action.payload, 1);
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  setPatternByID,
  setFabricsList,
  setInputFabric,
  updateFabric,
  addFabric,
  removeFabric
} = fabricCostSlice.actions;

export default fabricCostSlice.reducer;
