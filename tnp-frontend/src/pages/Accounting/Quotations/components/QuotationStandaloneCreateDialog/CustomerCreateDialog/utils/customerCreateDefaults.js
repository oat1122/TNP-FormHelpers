import { getDefaultManagerAssignment } from "../../../../../shared/utils/managerLogic";

// Build the empty form state for a new customer. Manager is seeded from the
// current user when they aren't an admin (admins must pick a sales user).
export const buildEmptyFormData = (isAdmin, currentUser) => ({
  cus_company: "",
  cus_firstname: "",
  cus_lastname: "",
  cus_name: "",
  cus_depart: "",
  cus_tel_1: "",
  cus_tel_2: "",
  cus_email: "",
  cus_tax_id: "",
  cus_address: "",
  cus_zip_code: "",
  cus_channel: "1",
  cus_bt_id: "",
  cus_pro_id: "",
  cus_dis_id: "",
  cus_sub_id: "",
  customer_type: "company",
  cus_manage_by: getDefaultManagerAssignment(isAdmin, currentUser),
});

export const CONTACT_CHANNELS = [
  { value: "1", label: "Sales" },
  { value: "2", label: "Online" },
  { value: "3", label: "Office" },
];
