import { AddressService } from "../../../../../../services/AddressService";
import { prepareManagerForApi } from "../../managerLogic";

const cleanDigits = (value) => (value ? String(value).replace(/[^0-9]/g, "") : value);

const normalizeBusinessTypeId = (cusBtId) => {
  if (cusBtId === "" || cusBtId == null) return null;
  const num = Number(cusBtId);
  return isNaN(num) ? cusBtId : num;
};

const normalizeChannelForApi = (cusChannel) => {
  if (cusChannel === "" || cusChannel == null) return null;
  return parseInt(cusChannel, 10);
};

export const buildCustomerUpdatePayload = (editData, { isAdmin, currentUser }) => {
  const addressData = AddressService.prepareAddressForApi(editData);
  const payload = { ...editData, ...addressData };

  const hasComponents = payload.cus_pro_id || payload.cus_dis_id || payload.cus_sub_id;
  if (hasComponents && payload.cus_address !== undefined) {
    const parsed = AddressService.parseFullAddress(payload.cus_address);
    payload.cus_address_detail = parsed.addressDetail || "";
  }

  payload.customer_type = editData.customer_type === "individual" ? "individual" : "company";
  payload.cus_type = payload.customer_type;
  payload.cus_channel = normalizeChannelForApi(editData.cus_channel);
  payload.cus_bt_id = normalizeBusinessTypeId(editData.cus_bt_id);
  payload.cus_manage_by = prepareManagerForApi(editData.cus_manage_by, isAdmin, currentUser);

  payload.cus_tel_1 = cleanDigits(payload.cus_tel_1);
  payload.cus_tel_2 = cleanDigits(payload.cus_tel_2);
  payload.cus_tax_id = cleanDigits(payload.cus_tax_id);

  return payload;
};

export const buildOptimisticDisplayAddress = (editData, { provinces, districts, subdistricts }) => {
  if (editData.cus_address && editData.cus_address.trim()) {
    return editData.cus_address.trim();
  }
  const proName =
    editData.cus_province_name ||
    provinces.find((p) => p.pro_id === editData.cus_pro_id)?.pro_name_th ||
    "";
  const disName =
    editData.cus_district_name ||
    districts.find((d) => d.dis_id === editData.cus_dis_id)?.dis_name ||
    districts.find((d) => d.dis_id === editData.cus_dis_id)?.dis_name_th ||
    "";
  const subName =
    editData.cus_subdistrict_name ||
    subdistricts.find((s) => s.sub_id === editData.cus_sub_id)?.sub_name ||
    subdistricts.find((s) => s.sub_id === editData.cus_sub_id)?.sub_name_th ||
    "";
  const zip = editData.cus_zip_code || "";

  const isBkk = proName.includes("กรุงเทพ");
  const parts = [];
  if (subName) parts.push(isBkk ? `แขวง${subName}` : `ตำบล${subName}`);
  if (disName) parts.push(isBkk ? `เขต${disName}` : `อำเภอ${disName}`);
  if (proName) parts.push(isBkk ? "กรุงเทพฯ" : `จ.${proName}`);
  if (zip) parts.push(zip);
  return parts.join(" ").trim();
};
