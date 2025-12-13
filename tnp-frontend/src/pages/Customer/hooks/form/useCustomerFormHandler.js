import { useDispatch } from "react-redux";
import { setInputList } from "../../../../features/Customer/customerSlice";
import { buildFullAddress } from "../../utils/addressUtils";

/**
 * useCustomerFormHandler - จัดการ Input Change และการแปลงค่าพิเศษ
 *
 * @param {Object} params
 * @param {Object} params.inputList - ข้อมูล form ปัจจุบัน
 * @param {Array} params.salesList - รายชื่อ Sales สำหรับ dropdown
 * @param {Function} params.clearFieldError - ลบ error ของ field
 * @returns {Object} { handleInputChange, handleCopyLastCustomer, handleBusinessTypeSelected }
 */
export const useCustomerFormHandler = ({ inputList, salesList, clearFieldError }) => {
  const dispatch = useDispatch();

  /**
   * จัดการการเปลี่ยนแปลง Input พร้อมแปลงค่าพิเศษ
   * - cus_tax_id, cus_zip_code: เอาเฉพาะตัวเลข
   * - cus_manage_by: แปลง string เป็น object
   * - Address fields: รวมเป็น full address string
   */
  const handleInputChange = (e) => {
    let { name, value } = e.target;

    // จัดการข้อมูลพิเศษ - กรองเฉพาะตัวเลข
    if (name === "cus_tax_id" || name === "cus_zip_code") {
      value = value.replace(/[^0-9]/g, "");
    }
    // จัดการข้อมูลพิเศษ - แปลง cus_manage_by เป็น object
    else if (name === "cus_manage_by") {
      if (typeof value === "object" && value !== null) {
        // ถ้าเป็น object แล้วไม่ต้องแปลง
        value = value;
      } else if (typeof value === "string") {
        // แปลง string (user_id) เป็น object
        const selectedUser = salesList.find((user) => String(user.user_id) === String(value));
        value = selectedUser
          ? {
              user_id: selectedUser.user_id,
              username:
                selectedUser.username ||
                selectedUser.user_nickname ||
                `User ${selectedUser.user_id}`,
            }
          : { user_id: "", username: "" };
      }
    }

    const newInputList = {
      ...inputList,
      [name]: value,
    };

    // อัพเดท cus_address เมื่อมีการเปลี่ยนแปลงในฟิลด์ที่อยู่
    // ใช้ utility function จาก addressUtils เพื่อ consistency
    if (["cus_address_detail", "cus_zip_code"].includes(name)) {
      newInputList.cus_address = buildFullAddress({
        address: name === "cus_address_detail" ? value : newInputList.cus_address_detail,
        subdistrict: newInputList.cus_subdistrict_text,
        district: newInputList.cus_district_text,
        province: newInputList.cus_province_text,
        zipCode: name === "cus_zip_code" ? value : newInputList.cus_zip_code,
      });
    }

    dispatch(setInputList(newInputList));

    // ลบ error ของ field ที่ถูกแก้ไข
    if (clearFieldError) {
      clearFieldError(name);
    }
  };

  /**
   * Copy ข้อมูลจากลูกค้าล่าสุด (Quick Action)
   */
  const handleCopyLastCustomer = (copyData) => {
    dispatch(
      setInputList({
        ...inputList,
        ...copyData,
      })
    );
  };

  /**
   * จัดการการเลือก Business Type จาก Modal
   */
  const handleBusinessTypeSelected = (typeId, onClose) => {
    dispatch(
      setInputList({
        ...inputList,
        cus_bt_id: typeId,
      })
    );

    if (clearFieldError) {
      clearFieldError("cus_bt_id");
    }

    if (onClose) {
      onClose();
    }
  };

  return {
    handleInputChange,
    handleCopyLastCustomer,
    handleBusinessTypeSelected,
  };
};
