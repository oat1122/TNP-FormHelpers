const splitContactPerson = (contactPerson = "") => {
  const nameParts = String(contactPerson || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
  };
};

export const mapNotebookToCustomer = (notebook) => {
  const leadPayload = notebook?.nb_lead_payload || {};
  const contactPerson = splitContactPerson(
    leadPayload.cus_firstname && leadPayload.cus_lastname
      ? `${leadPayload.cus_firstname} ${leadPayload.cus_lastname}`
      : notebook?.nb_contact_person
  );

  return {
    cus_company: leadPayload.cus_company || notebook?.nb_customer_name || "",
    cus_name: leadPayload.cus_name || notebook?.nb_customer_name || "",
    cus_tel_1: leadPayload.cus_tel_1 || notebook?.nb_contact_number || "",
    cus_tel_2: leadPayload.cus_tel_2 || "",
    cus_email: leadPayload.cus_email || notebook?.nb_email || "",
    cus_firstname: leadPayload.cus_firstname || contactPerson.firstName,
    cus_lastname: leadPayload.cus_lastname || contactPerson.lastName,
    cus_channel: leadPayload.cus_channel || (notebook?.nb_is_online ? 2 : 1),
    cus_bt_id: leadPayload.cus_bt_id || "",
    cus_pro_id: leadPayload.cus_pro_id || "",
    cus_dis_id: leadPayload.cus_dis_id || "",
    cus_sub_id: leadPayload.cus_sub_id || "",
    cus_zip_code: leadPayload.cus_zip_code || "",
    cus_address: leadPayload.cus_address || "",
    cus_tax_id: leadPayload.cus_tax_id || "",
    cd_note:
      leadPayload.cd_note ||
      `${notebook?.nb_remarks || ""} ${notebook?.nb_additional_info || ""}`.trim(),
    cus_manage_by: notebook?.nb_manage_by,
  };
};
