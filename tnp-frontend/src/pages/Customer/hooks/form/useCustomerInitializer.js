import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setInputList } from "../../../../features/Customer/customerSlice";
import { genCustomerNo } from "../../../../features/Customer/customerUtils";

/**
 * useCustomerInitializer - จัดการ Initialize ค่าเริ่มต้นเมื่อเปิด Dialog (Create Mode)
 *
 * @param {Object} params
 * @param {string} params.mode - โหมดของ form ('create' | 'edit' | 'view')
 * @param {Array} params.itemList - รายการลูกค้าทั้งหมด (ใช้หา max cus_no)
 * @param {Array} params.groupList - รายการ Group ทั้งหมด
 * @param {Object} params.user - ข้อมูล User ปัจจุบัน
 * @param {Object} params.inputList - ข้อมูล form ปัจจุบัน
 * @param {boolean} params.openDialog - สถานะ Dialog เปิด/ปิด
 */
export const useCustomerInitializer = ({
  mode,
  itemList,
  groupList,
  user,
  inputList,
  openDialog,
}) => {
  const dispatch = useDispatch();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    // ทำงานเฉพาะ Create Mode และ Dialog เปิดอยู่
    if (mode !== "create" || !openDialog) {
      return;
    }

    // Generate cus_no ใหม่จาก max ใน itemList
    const maxCusNo = String(Math.max(...itemList.map((customer) => parseInt(customer.cus_no, 10))));
    const newCusNo = genCustomerNo(maxCusNo);

    // หา cus_mcg_id เริ่มต้นจาก groupList (ตามลำดับ sort สูงสุด)
    const cus_mcg_id =
      groupList.length > 0
        ? groupList.reduce(
            (max, group) =>
              parseInt(group.mcg_sort, 10) > parseInt(max.mcg_sort, 10) ? group : max,
            groupList[0]
          ).mcg_id
        : null;

    // Set cus_manage_by ตาม role
    // - Admin: ว่าง (เลือกได้)
    // - Sales: ตัวเอง
    const cus_manage_by = isAdmin ? "" : { user_id: user.user_id };

    dispatch(
      setInputList({
        ...inputList,
        cus_no: newCusNo,
        cus_mcg_id: cus_mcg_id,
        cus_manage_by: cus_manage_by,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, openDialog]);
  // หมายเหตุ: ไม่ใส่ itemList, groupList, inputList ใน dependencies
  // เพราะต้องการให้ทำงานแค่ตอน mode เปลี่ยนหรือ dialog เปิด
};
