import { AddressService } from "../../../../../../../services/AddressService";
import { prepareManagerForApi } from "../../../../../shared/utils/managerLogic";

const onlyDigits = (value) => (value ? String(value).replace(/[^0-9]/g, "") : "");

// Build the POST /customers payload from the form state.
// - Merges sanitized address fields via AddressService
// - Coerces channel + business type to numeric where appropriate
// - Resolves manager assignment for admin vs sale role
// - Strips non-digit chars from phone + tax id
export function buildCustomerCreatePayload(formData, { isAdmin, currentUser }) {
  const addressData = AddressService.prepareAddressForApi(formData);
  const apiData = { ...formData, ...addressData };

  const hasAddressComponents = apiData.cus_pro_id || apiData.cus_dis_id || apiData.cus_sub_id;
  if (hasAddressComponents && apiData.cus_address !== undefined) {
    apiData.cus_address_detail = apiData.cus_address;
  }

  apiData.customer_type = formData.customer_type === "individual" ? "individual" : "company";
  apiData.cus_type = apiData.customer_type;
  apiData.cus_channel = formData.cus_channel === "" ? null : parseInt(formData.cus_channel, 10);
  apiData.cus_bt_id =
    formData.cus_bt_id === ""
      ? null
      : Number.isNaN(Number(formData.cus_bt_id))
        ? formData.cus_bt_id
        : Number(formData.cus_bt_id);

  apiData.cus_manage_by = prepareManagerForApi(formData.cus_manage_by, isAdmin, currentUser);

  apiData.cus_tel_1 = onlyDigits(apiData.cus_tel_1);
  apiData.cus_tel_2 = onlyDigits(apiData.cus_tel_2);
  apiData.cus_tax_id = onlyDigits(apiData.cus_tax_id);

  return apiData;
}

// Pull the created customer object out of the create-mutation response, falling
// back to the form state with the new id grafted on so callers always receive a
// usable customer record (CustomerSelector etc. depend on `cus_id` being set).
export function extractCreatedCustomer(result, formData) {
  if (result?.data?.data && typeof result.data.data === "object" && result.data.data.cus_id) {
    return result.data.data;
  }
  if (result?.data && typeof result.data === "object" && result.data.cus_id) {
    return result.data;
  }
  if (result?.cus_id) return result;

  const customerId =
    result?.customer_id ?? result?.data?.customer_id ?? result?.data?.data?.cus_id ?? null;

  return {
    ...formData,
    cus_id: customerId,
    cus_manage_by: formData.cus_manage_by,
    sales_name: formData.cus_manage_by?.username || "",
  };
}
