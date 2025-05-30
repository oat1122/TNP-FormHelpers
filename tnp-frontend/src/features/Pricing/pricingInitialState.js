import { v4 as uuid } from "uuid";

export default {
  item: [],
  itemList: [],
  statusList: [],
  statusSelected: "all",
  paginationModel: { pageSize: 10, page: 0 },
  customerList: [],
  inputList: {
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
  },
  mode: "",
  totalCount: 0,
  imagePreview: "",
};