/**
 * Custom Hook สำหรับตรวจสอบข้อมูลซ้ำ (Duplicate Check) สำหรับ DialogForm
 *
 * แยก Logic ออกจาก TelesalesQuickForm เพื่อป้องกันการทับซ้อน:
 * - ตรวจสอบเบอร์โทรซ้ำ (blocking dialog)
 * - ตรวจสอบชื่อบริษัทซ้ำ (warning alert)
 * - รองรับ edit mode (ไม่แจ้งเตือนถ้าเป็นลูกค้าตัวเอง)
 */

import { useState, useCallback, useRef } from "react";

import { useCheckDuplicateCustomerMutation } from "../../../features/Customer/customerApi";

export const useDuplicateCheck = ({ mode = "create", currentCustomerId = null }) => {
  // Duplicate checking states
  const [duplicatePhoneDialogOpen, setDuplicatePhoneDialogOpen] = useState(false);
  const [duplicatePhoneData, setDuplicatePhoneData] = useState(null);
  const [companyWarning, setCompanyWarning] = useState(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isCheckingCompany, setIsCheckingCompany] = useState(false);

  // Track last checked values to avoid redundant API calls
  const lastCheckedPhone = useRef("");
  const lastCheckedCompany = useRef("");

  // API hook
  const [checkDuplicate] = useCheckDuplicateCustomerMutation();

  /**
   * ตรวจสอบเบอร์โทรซ้ำ - เรียกใช้เมื่อ blur จาก phone field
   * @param {string} phone - เบอร์โทรที่ต้องการตรวจสอบ
   * @returns {Promise<boolean>} - true ถ้าพบซ้ำ, false ถ้าไม่ซ้ำ
   */
  const checkPhoneDuplicate = useCallback(
    async (phone) => {
      // Skip if empty
      if (!phone || !phone.trim()) return false;

      // Clean phone number (remove spaces, dashes, parentheses)
      const cleanPhone = phone.trim().replace(/[\s\-()]/g, "");

      // Validate: Must contain at least 9 digits
      const digitCount = cleanPhone.replace(/\D/g, "").length;
      if (digitCount < 9) {
        return false;
      }

      // Check if value changed (avoid redundant API calls)
      if (cleanPhone === lastCheckedPhone.current) {
        return !!duplicatePhoneData;
      }

      lastCheckedPhone.current = cleanPhone;

      try {
        setIsCheckingPhone(true);
        console.log("📞 [DialogForm Duplicate Check] Checking phone:", cleanPhone);

        const result = await checkDuplicate({
          type: "phone",
          value: cleanPhone,
        }).unwrap();

        if (result.found && result.data.length > 0) {
          // In edit mode, skip if duplicate is the same customer
          if (mode === "edit" && currentCustomerId) {
            const isSameCustomer = result.data.some(
              (customer) => customer.cus_id === currentCustomerId
            );
            if (isSameCustomer && result.data.length === 1) {
              console.log("✅ [DialogForm] Phone belongs to current customer, skipping");
              setIsCheckingPhone(false);
              return false;
            }
          }

          console.log("⚠️ [DialogForm Duplicate Found] Phone exists:", result.data[0]);
          setDuplicatePhoneData(result.data[0]);
          setDuplicatePhoneDialogOpen(true);
          setIsCheckingPhone(false);
          return true;
        }

        setDuplicatePhoneData(null);
        setIsCheckingPhone(false);
        return false;
      } catch (error) {
        console.error("❌ [DialogForm Duplicate Check] Failed:", error);
        setIsCheckingPhone(false);
        return false;
      }
    },
    [checkDuplicate, mode, currentCustomerId, duplicatePhoneData]
  );

  /**
   * ตรวจสอบชื่อบริษัทซ้ำ - เรียกใช้เมื่อ blur จาก company field
   * @param {string} company - ชื่อบริษัทที่ต้องการตรวจสอบ
   * @returns {Promise<boolean>} - true ถ้าพบซ้ำ, false ถ้าไม่ซ้ำ
   */
  const checkCompanyDuplicate = useCallback(
    async (company) => {
      // Skip if empty or too short (< 3 characters)
      if (!company || company.trim().length < 3) {
        setCompanyWarning(null);
        return false;
      }

      const cleanCompany = company.trim();

      // Check if value changed (avoid redundant API calls)
      if (cleanCompany === lastCheckedCompany.current) {
        return !!companyWarning;
      }

      lastCheckedCompany.current = cleanCompany;

      try {
        setIsCheckingCompany(true);
        console.log("🏢 [DialogForm Duplicate Check] Checking company:", cleanCompany);

        const result = await checkDuplicate({
          type: "company",
          value: cleanCompany,
        }).unwrap();

        if (result.found && result.data.length > 0) {
          // In edit mode, filter out current customer from results
          let filteredData = result.data;
          if (mode === "edit" && currentCustomerId) {
            filteredData = result.data.filter((customer) => customer.cus_id !== currentCustomerId);
          }

          if (filteredData.length > 0) {
            console.log("⚠️ [DialogForm Duplicate Found] Company exists:", filteredData);
            setCompanyWarning({
              count: filteredData.length,
              examples: filteredData.slice(0, 2), // Show max 2 examples
            });
            setIsCheckingCompany(false);
            return true;
          }
        }

        setCompanyWarning(null);
        setIsCheckingCompany(false);
        return false;
      } catch (error) {
        console.error("❌ [DialogForm Duplicate Check] Failed:", error);
        setIsCheckingCompany(false);
        return false;
      }
    },
    [checkDuplicate, mode, currentCustomerId, companyWarning]
  );

  /**
   * ปิด dialog แจ้งเตือนเบอร์ซ้ำ
   */
  const closeDuplicatePhoneDialog = useCallback(() => {
    setDuplicatePhoneDialogOpen(false);
    // Keep data for reference, don't clear it
  }, []);

  /**
   * ล้าง warning ของ company
   */
  const clearCompanyWarning = useCallback(() => {
    setCompanyWarning(null);
  }, []);

  /**
   * ล้างข้อมูล duplicate phone (เรียกเมื่อผู้ใช้แก้ไขเบอร์โทร)
   */
  const clearDuplicatePhoneData = useCallback(() => {
    setDuplicatePhoneData(null);
    lastCheckedPhone.current = "";
  }, []);

  /**
   * Reset ทุกอย่าง (เรียกเมื่อปิด dialog หรือสร้างใหม่)
   */
  const resetDuplicateChecks = useCallback(() => {
    setDuplicatePhoneDialogOpen(false);
    setDuplicatePhoneData(null);
    setCompanyWarning(null);
    setIsCheckingPhone(false);
    setIsCheckingCompany(false);
    lastCheckedPhone.current = "";
    lastCheckedCompany.current = "";
  }, []);

  /**
   * ตรวจสอบว่ามีการแจ้งเตือน duplicate หรือไม่
   */
  const hasDuplicateWarning = !!(duplicatePhoneData || companyWarning);

  return {
    // States
    duplicatePhoneDialogOpen,
    duplicatePhoneData,
    companyWarning,
    isCheckingPhone,
    isCheckingCompany,
    hasDuplicateWarning,

    // Handlers
    checkPhoneDuplicate,
    checkCompanyDuplicate,
    closeDuplicatePhoneDialog,
    clearCompanyWarning,
    clearDuplicatePhoneData,
    resetDuplicateChecks,
  };
};
