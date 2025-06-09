import { useCallback } from 'react';
import { useApiErrorHandler } from './useApiErrorHandler';
import { swal_delete_by_id } from '../utils/dialog_swal2/dialog_delete_by_id';
import { open_dialog_loading } from '../utils/import_lib';

export const useCustomerOperations = (refetch) => {
  const { handleError, handleSuccess } = useApiErrorHandler();

  const deleteCustomer = useCallback(async (deleteCustomerMutation, customer) => {
    const confirmed = await swal_delete_by_id(
      `กรุณายืนยันการลบข้อมูล ${customer.cus_name}`
    );

    if (confirmed) {
      open_dialog_loading();
      try {
        const res = await deleteCustomerMutation(customer.cus_id);
        if (res.data.status === "success") {
          handleSuccess("ลบข้อมูลสำเร็จ", refetch);
        }
      } catch (error) {
        handleError(error, "เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    }
  }, [handleError, handleSuccess, refetch]);

  const recallCustomer = useCallback(async (updateRecallMutation, customer, userId) => {
    const confirmed = await swal_delete_by_id(
      `กรุณายืนยันการรีเซตเวลาของ ${customer.cus_name}`
    );

    if (confirmed) {
      open_dialog_loading();
      try {
        const inputUpdate = {
          cus_mcg_id: customer.cus_mcg_id,
          cd_id: customer.cd_id,
          cd_updated_by: userId,
        };

        const res = await updateRecallMutation(inputUpdate);
        if (res.data.status === "success") {
          handleSuccess("รีเซตเวลาสำเร็จ", refetch);
        }
      } catch (error) {
        handleError(error, "เกิดข้อผิดพลาดในการรีเซตเวลา");
      }
    }
  }, [handleError, handleSuccess, refetch]);

  const changeCustomerGroup = useCallback(async (updateCustomerMutation, isUp, customer, groupList, userId) => {
    // Find target group logic
    const targetGroup = groupList.find(group => group.mcg_id === customer.cus_mcg_id);
    if (!targetGroup) return;

    const sortOffset = isUp ? -1 : 1;
    const targetSort = targetGroup.mcg_sort + sortOffset;
    const groupResult = groupList.find(group => group.mcg_sort === targetSort);
    
    if (!groupResult) return;

    const confirmed = await swal_delete_by_id(
      `กรุณายืนยันการเปลี่ยนเกรดของ ${customer.cus_name}`
    );

    if (confirmed) {
      open_dialog_loading();
      try {
        const inputUpdate = {
          ...customer,
          cus_mcg_id: groupResult.mcg_id,
          cus_updated_by: userId,
        };

        const res = await updateCustomerMutation(inputUpdate);
        if (res.data.status === "success") {
          handleSuccess("บันทึกข้อมูลสำเร็จ", refetch);
        }
      } catch (error) {
        handleError(error, "เกิดข้อผิดพลาดในการเปลี่ยนเกรด");
      }
    }
  }, [handleError, handleSuccess, refetch]);

  return {
    deleteCustomer,
    recallCustomer, 
    changeCustomerGroup
  };
};
