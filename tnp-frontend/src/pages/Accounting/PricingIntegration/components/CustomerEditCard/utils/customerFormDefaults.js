import { parseAddressDetail } from "./addressParsing";
import { normalizeChannelValue } from "./channelNormalization";
import { getDefaultManagerAssignment, normalizeManagerData } from "../../managerLogic";

const deriveManagerAssignment = (customer, { isAdmin, currentUser }) => {
  if (!isAdmin && currentUser?.user_id) {
    return getDefaultManagerAssignment(isAdmin, currentUser);
  }
  return normalizeManagerData(customer.cus_manage_by, customer.sales_name);
};

const deriveCustomerType = (customer) =>
  customer.customer_type || customer.cus_type || (customer.cus_company ? "company" : "individual");

const deriveAddressDetail = (customer) => {
  if (customer.cus_address_detail) return customer.cus_address_detail;
  if (customer.cus_address) return parseAddressDetail(customer.cus_address);
  return "";
};

const deriveBusinessTypeId = (customer) => {
  const raw =
    customer.cus_bt_id ??
    customer.bt_id ??
    customer.business_type_id ??
    customer.business_type?.bt_id ??
    null;
  return raw == null ? "" : String(raw);
};

export const makeInitialEditData = (customer, options = {}) => {
  if (!customer) {
    return {
      cus_channel: "1",
      cus_manage_by: { user_id: "", username: "" },
    };
  }

  const channelRaw = customer.cus_channel ?? customer.channel ?? null;
  const initType = deriveCustomerType(customer);

  return {
    cus_company: customer.cus_company || "",
    cus_firstname: customer.cus_firstname || "",
    cus_lastname: customer.cus_lastname || "",
    cus_name: customer.cus_name || "",
    cus_depart: customer.cus_depart || "",
    cus_tel_1: customer.cus_tel_1 || "",
    cus_tel_2: customer.cus_tel_2 || "",
    cus_email: customer.cus_email || "",
    cus_tax_id: customer.cus_tax_id || "",
    cus_address: deriveAddressDetail(customer),
    cus_zip_code: customer.cus_zip_code || "",
    cus_channel: normalizeChannelValue(channelRaw) || "1",
    cus_bt_id: deriveBusinessTypeId(customer),
    cus_pro_id: customer.cus_pro_id || "",
    cus_dis_id: customer.cus_dis_id || "",
    cus_sub_id: customer.cus_sub_id || "",
    customer_type: initType === "individual" ? "individual" : "company",
    cus_manage_by: deriveManagerAssignment(customer, options),
  };
};

export const mergeHydratedCustomer = (prevEditData, hydratedCustomer) => {
  const merged = hydratedCustomer || {};
  const mergedCh = normalizeChannelValue(merged.cus_channel ?? merged.channel);
  const mergedBt = merged.cus_bt_id ?? merged.bt_id ?? merged.business_type_id ?? "";

  let mergedManage = prevEditData.cus_manage_by;
  const mRaw = merged.cus_manage_by;
  if (!mergedManage?.user_id || mergedManage?.username === "กำลังโหลด...") {
    if (mRaw && typeof mRaw === "object") {
      mergedManage = {
        user_id: String(mRaw.user_id || mRaw.id || ""),
        username: mRaw.username || mRaw.name || merged.sales_name || "",
      };
    } else if (mRaw) {
      mergedManage = {
        user_id: String(mRaw),
        username: merged.sales_name || "",
      };
    }
  }

  const parsedAddressDetail = merged.cus_address
    ? parseAddressDetail(merged.cus_address)
    : prevEditData.cus_address;

  return {
    ...prevEditData,
    cus_channel: mergedCh || prevEditData.cus_channel || "1",
    cus_bt_id: mergedBt ? String(mergedBt) : prevEditData.cus_bt_id,
    cus_tax_id: merged.cus_tax_id || prevEditData.cus_tax_id,
    cus_manage_by: mergedManage,
    cus_company: merged.cus_company || prevEditData.cus_company,
    cus_firstname: merged.cus_firstname || prevEditData.cus_firstname,
    cus_lastname: merged.cus_lastname || prevEditData.cus_lastname,
    cus_name: merged.cus_name || prevEditData.cus_name,
    cus_depart: merged.cus_depart || prevEditData.cus_depart,
    cus_tel_1: merged.cus_tel_1 || prevEditData.cus_tel_1,
    cus_tel_2: merged.cus_tel_2 || prevEditData.cus_tel_2,
    cus_email: merged.cus_email || prevEditData.cus_email,
    cus_address: parsedAddressDetail,
    cus_pro_id: merged.cus_pro_id || prevEditData.cus_pro_id,
    cus_dis_id: merged.cus_dis_id || prevEditData.cus_dis_id,
    cus_sub_id: merged.cus_sub_id || prevEditData.cus_sub_id,
    cus_zip_code: merged.cus_zip_code || prevEditData.cus_zip_code,
  };
};
