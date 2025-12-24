import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  useDelCustomerMutation,
  useUpdateRecallMutation,
  useChangeGradeMutation,
} from "../../../features/Customer/customerApi";
import { resetInputList, setInputList, setMode } from "../../../features/Customer/customerSlice";
import { setLocationSearch } from "../../../features/globalSlice";
import { swal_delete_by_id } from "../../../utils/dialog_swal2/dialog_delete_by_id";
import {
  open_dialog_ok_timer,
  open_dialog_loading,
  open_dialog_error,
} from "../../../utils/import_lib";

export const useCustomerActions = (scrollToTop) => {
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("userData"));
  const itemList = useSelector((state) => state.customer.itemList);
  const groupList = useSelector((state) => state.customer.groupList);

  const [delCustomer] = useDelCustomerMutation();
  const [updateRecall] = useUpdateRecallMutation();
  const [changeGrade] = useChangeGradeMutation();

  // จัดการการเปิด Dialog
  const handleOpenDialog = (mode, cus_id = null) => {
    dispatch(resetInputList());

    if (mode !== "create" && cus_id) {
      const itemFill = itemList.find((item) => item.cus_id === cus_id);

      if (itemFill) {
        let managedBy = { user_id: "", username: "" };

        if (itemFill.cus_manage_by) {
          if (typeof itemFill.cus_manage_by === "object" && itemFill.cus_manage_by.user_id) {
            managedBy = {
              user_id: String(itemFill.cus_manage_by.user_id),
              username: itemFill.cus_manage_by.username || "",
            };
          } else if (
            typeof itemFill.cus_manage_by === "string" ||
            typeof itemFill.cus_manage_by === "number"
          ) {
            managedBy = {
              user_id: String(itemFill.cus_manage_by),
              username: "",
            };
          }
        }

        // Parse cus_address_detail จาก cus_address (ถ้าไม่มี cus_address_detail แยก)
        let addressDetail = itemFill.cus_address_detail || "";
        if (!addressDetail && itemFill.cus_address) {
          // Pattern: "ที่อยู่ แขวงXXX เขตXXX จังหวัดXXX XXXXX" หรือ "ที่อยู่ ต.XXX อ.XXX จ.XXX XXXXX"
          // ดึงส่วนก่อน แขวง/ตำบล/ต. ออกมา
          const address = itemFill.cus_address;
          const patterns = [
            /^(.+?)(?:\s+แขวง)/, // ก่อน "แขวง"
            /^(.+?)(?:\s+ตำบล)/, // ก่อน "ตำบล"
            /^(.+?)(?:\s+ต\.)/, // ก่อน "ต."
          ];

          for (const pattern of patterns) {
            const match = address.match(pattern);
            if (match && match[1]) {
              addressDetail = match[1].trim();
              break;
            }
          }
        }

        const formattedItem = {
          ...itemFill,
          cus_manage_by: managedBy,
          cus_address_detail: addressDetail,
        };

        dispatch(setInputList(formattedItem));

        if (itemFill.province_sort_id || itemFill.district_sort_id) {
          dispatch(
            setLocationSearch({
              province_sort_id: itemFill.province_sort_id || "",
              district_sort_id: itemFill.district_sort_id || "",
            })
          );
        }

        console.log(`Loading customer data for ${mode}: `, formattedItem);
      } else {
        console.warn(`Customer with ID ${cus_id} not found in itemList`);
      }
    }

    dispatch(setMode(mode));
    return true; // สำหรับใช้ใน component หลัก
  };

  // จัดการการปิด Dialog
  const handleCloseDialog = () => {
    setTimeout(() => {
      dispatch(resetInputList());
      dispatch(setMode(""));
    }, 500);
    return false; // สำหรับใช้ใน component หลัก
  };

  // จัดการการลบลูกค้า
  const handleDelete = async (params) => {
    const confirmed = await swal_delete_by_id(`กรุณายืนยันการลบข้อมูล ${params.cus_name}`);

    if (confirmed) {
      open_dialog_loading();

      try {
        const res = await delCustomer(params.cus_id);

        if (res.data.status === "success") {
          open_dialog_ok_timer("ลบข้อมูลสำเร็จ");
          scrollToTop();
        }
      } catch (error) {
        open_dialog_error(error.message, error);
        console.error(error);
      }
    }
  };

  // จัดการการรีเซ็ต recall timer
  const handleRecall = async (params) => {
    const confirmed = await swal_delete_by_id(`กรุณายืนยันการรีเซตเวลาของ ${params.cus_name}`);

    if (confirmed) {
      open_dialog_loading();

      const inputUpdate = {
        cus_mcg_id: params.cus_mcg_id,
        cd_id: params.cd_id,
        cd_updated_by: user.user_id,
      };

      try {
        const res = await updateRecall(inputUpdate);

        if (res.data.status === "success") {
          open_dialog_ok_timer("รีเซตเวลาสำเร็จ");
          scrollToTop();
        }
      } catch (error) {
        open_dialog_error(error.message, error);
        console.error(error);
      }
    }
  };

  // จัดการการเปลี่ยน grade
  const handleChangeGroup = async (is_up, params, refetch) => {
    const direction = is_up ? "up" : "down";

    const currentGroup = groupList.find((group) => group.mcg_id === params.cus_mcg_id);
    const currentGrade = currentGroup ? currentGroup.mcg_name : "?";

    let targetGrade = "?";
    if (currentGroup) {
      const targetSort = currentGroup.mcg_sort + (is_up ? -1 : 1);
      const targetGroup = groupList.find((group) => group.mcg_sort === targetSort);
      if (targetGroup) {
        targetGrade = targetGroup.mcg_name;
      }
    }

    const gradeChangeText = is_up
      ? `เปลี่ยนเกรดขึ้นจาก ${currentGrade} เป็น ${targetGrade}`
      : `เปลี่ยนเกรดลงจาก ${currentGrade} เป็น ${targetGrade}`;

    const confirmed = await swal_delete_by_id(
      `กรุณายืนยันการเปลี่ยนเกรดของ ${params.cus_name}: ${gradeChangeText}`
    );

    if (confirmed) {
      open_dialog_loading();

      try {
        const res = await changeGrade({
          customerId: params.cus_id,
          direction: direction,
        }).unwrap();

        if (res.status === "success") {
          open_dialog_ok_timer(
            `เปลี่ยนเกรดสำเร็จ จาก ${res.data.old_grade} เป็น ${res.data.new_grade}`
          );
          refetch();
          scrollToTop();
        }
      } catch (error) {
        open_dialog_error(error.data?.message || error.message, error);
        console.error(error);
      }
    }
  };

  // ตรวจสอบว่าควร disable button หรือไม่
  const handleDisableChangeGroupBtn = useMemo(
    () => (is_up, params) => {
      const matchGroup = groupList.find((group) => group.mcg_id === params.cus_mcg_id);
      if (!matchGroup) return true;

      const minSort = 1; // Grade A has sort = 1
      const maxSort = 4; // Grade D has sort = 4

      if (is_up) {
        return matchGroup.mcg_sort <= minSort;
      } else {
        return matchGroup.mcg_sort >= maxSort;
      }
    },
    [groupList]
  );

  return {
    handleOpenDialog,
    handleCloseDialog,
    handleDelete,
    handleRecall,
    handleChangeGroup,
    handleDisableChangeGroupBtn,
    user,
  };
};
