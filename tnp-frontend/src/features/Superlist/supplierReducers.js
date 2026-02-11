export default {
  setProductList: (state, action) => {
    state.productList = action.payload;
  },
  setTagList: (state, action) => {
    state.tagList = action.payload;
  },
  setSelectedProduct: (state, action) => {
    state.selectedProduct = action.payload;
  },
  setPaginationModel: (state, action) => {
    state.paginationModel = action.payload;
  },
  setTotalCount: (state, action) => {
    state.totalCount = action.payload;
  },
  setFilters: (state, action) => {
    state.filters = { ...state.filters, ...action.payload };
  },
  resetFilters: (state) => {
    state.filters = {
      search: "",
      category: "",
      tags: [],
      country: "",
      currency: "",
      sort_by: "created_at",
      sort_dir: "desc",
    };
  },
  setInputForm: (state, action) => {
    state.inputForm = action.payload;
  },
  updateInputField: (state, action) => {
    const { field, value } = action.payload;
    state.inputForm[field] = value;
  },
  resetInputForm: (state) => {
    state.inputForm = {
      sp_name: "",
      sp_description: "",
      sp_sku: "",
      sp_mpc_id: "",
      sp_origin_country: "",
      sp_supplier_name: "",
      sp_supplier_contact: "",
      sp_base_price: "",
      sp_currency: "THB",
      sp_price_thb: "",
      sp_exchange_rate: "",
      sp_exchange_date: "",
      sp_unit: "ชิ้น",
      tag_ids: [],
      price_tiers: [],
      images: [],
    };
  },
  setMode: (state, action) => {
    state.mode = action.payload;
  },
};
