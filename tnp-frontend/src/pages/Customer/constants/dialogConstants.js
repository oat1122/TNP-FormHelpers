// Title mapping for different dialog modes
export const titleMap = {
  create: "เพิ่ม",
  edit: "แก้ไข",
  view: "ดู",
};

// Channel options for customer contact method
export const selectList = [
  { value: "1", title: "sales" },
  { value: "2", title: "online" },
  { value: "3", title: "office" },
];

// Field mapping for tab navigation during validation
export const tabFieldMapping = {
  // Tab 0: Basic Info
  basicInfo: [
    "cus_company",
    "cus_firstname",
    "cus_lastname",
    "cus_name",
    "cus_depart",
    "cus_bt_id",
    "cus_channel",
    "cus_manage_by",
  ],
  // Tab 1: Contact Info
  contactInfo: ["cus_tel_1", "cus_tel_2", "cus_email", "cus_tax_id"],
  // Tab 2: Address Info
  addressInfo: ["cus_address", "cus_pro_id", "cus_dis_id", "cus_sub_id", "cus_zip_code"],
  // Tab 3: Notes (default for any other fields)
  notesInfo: ["cd_note", "cd_remark"],
};

// Tab props generator for accessibility
export function a11yProps(index) {
  return {
    id: `customer-tab-${index}`,
    "aria-controls": `customer-tabpanel-${index}`,
  };
}
