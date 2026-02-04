export const mapNotebookToCustomer = (notebook) => {
  // nb_customer_name -> cus_company / cus_name (logic: if has "บริษัท" -> company, else name)
  // nb_contact_number -> cus_tel_1
  // nb_email -> cus_email
  // nb_contact_person -> cus_firstname / cus_lastname (split by space)

  const isCompany =
    notebook.nb_customer_name?.includes("บริษัท") || notebook.nb_customer_name?.includes("หจก.");

  const nameParts = notebook.nb_contact_person ? notebook.nb_contact_person.split(" ") : [];
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  return {
    cus_company: isCompany ? notebook.nb_customer_name : "",
    cus_name: !isCompany ? notebook.nb_customer_name : "", // Store Name if not company
    cus_tel_1: notebook.nb_contact_number || "",
    cus_email: notebook.nb_email || "",
    cus_firstname: firstName,
    cus_lastname: lastName,
    cd_note: `${notebook.nb_remarks || ""} \n[ข้อมูลเพิ่มเติมจาก Notebook]: ${notebook.nb_additional_info || ""}`,
    cus_channel: notebook.nb_is_online ? 2 : 1, // 2 = Online, 1 = Sales (Default)
    cus_manage_by: notebook.nb_manage_by, // Map Manager from Notebook to Customer
  };
};
