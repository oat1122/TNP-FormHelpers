/**
 * Custom Hook สำหรับ Standalone Duplicate Check Form
 *
 * ใช้สำหรับตรวจสอบข้อมูลซ้ำแบบ standalone (ไม่ผูกกับ create/edit form)
 * - ตรวจสอบเบอร์โทรซ้ำ
 * - ตรวจสอบชื่อบริษัทซ้ำ
 * - สามารถเช็คทีละฟิลด์หรือทั้งสองพร้อมกันได้
 */

import { useState, useCallback } from "react";

import { useCheckDuplicateCustomerMutation } from "../../../../features/Customer/customerApi";

export const useDuplicateCheckForm = () => {
  // Input states
  const [phoneInput, setPhoneInput] = useState("");
  const [companyInput, setCompanyInput] = useState("");

  // Result states
  const [phoneResults, setPhoneResults] = useState(null); // null = not checked, [] = no results
  const [companyResults, setCompanyResults] = useState(null);

  // Loading states
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isCheckingCompany, setIsCheckingCompany] = useState(false);

  // Error states
  const [phoneError, setPhoneError] = useState("");
  const [companyError, setCompanyError] = useState("");

  // API hook
  const [checkDuplicate] = useCheckDuplicateCustomerMutation();

  /**
   * ตรวจสอบเบอร์โทรซ้ำ
   */
  const handleCheckPhone = useCallback(async () => {
    const phone = phoneInput.trim();
    if (!phone) {
      setPhoneError("กรุณากรอกเบอร์โทร");
      return;
    }

    // Clean phone number
    const cleanPhone = phone.replace(/[\s\-()]/g, "");
    const digitCount = cleanPhone.replace(/\D/g, "").length;

    if (digitCount < 9) {
      setPhoneError("กรุณากรอกเบอร์โทรอย่างน้อย 9 หลัก");
      return;
    }

    setPhoneError("");

    try {
      setIsCheckingPhone(true);
      const result = await checkDuplicate({
        type: "phone",
        value: cleanPhone,
      }).unwrap();

      if (result.found && result.data.length > 0) {
        setPhoneResults(result.data);
      } else {
        setPhoneResults([]);
      }
    } catch (error) {
      console.error("❌ [DuplicateCheckForm] Phone check failed:", error);
      setPhoneError("เกิดข้อผิดพลาดในการตรวจสอบ");
    } finally {
      setIsCheckingPhone(false);
    }
  }, [phoneInput, checkDuplicate]);

  /**
   * ตรวจสอบชื่อบริษัทซ้ำ
   */
  const handleCheckCompany = useCallback(async () => {
    const company = companyInput.trim();
    if (!company) {
      setCompanyError("กรุณากรอกชื่อบริษัท");
      return;
    }

    if (company.length < 3) {
      setCompanyError("กรุณากรอกชื่อบริษัทอย่างน้อย 3 ตัวอักษร");
      return;
    }

    setCompanyError("");

    try {
      setIsCheckingCompany(true);
      const result = await checkDuplicate({
        type: "company",
        value: company,
      }).unwrap();

      if (result.found && result.data.length > 0) {
        setCompanyResults(result.data);
      } else {
        setCompanyResults([]);
      }
    } catch (error) {
      console.error("❌ [DuplicateCheckForm] Company check failed:", error);
      setCompanyError("เกิดข้อผิดพลาดในการตรวจสอบ");
    } finally {
      setIsCheckingCompany(false);
    }
  }, [companyInput, checkDuplicate]);

  /**
   * ตรวจสอบทั้งเบอร์โทรและชื่อบริษัทพร้อมกัน
   */
  const handleCheckBoth = useCallback(async () => {
    const hasPhone = phoneInput.trim().length > 0;
    const hasCompany = companyInput.trim().length > 0;

    if (!hasPhone && !hasCompany) {
      setPhoneError("กรุณากรอกเบอร์โทรหรือชื่อบริษัท");
      return;
    }

    const promises = [];
    if (hasPhone) promises.push(handleCheckPhone());
    if (hasCompany) promises.push(handleCheckCompany());

    await Promise.all(promises);
  }, [phoneInput, companyInput, handleCheckPhone, handleCheckCompany]);

  /**
   * Reset ทุกอย่าง
   */
  const resetForm = useCallback(() => {
    setPhoneInput("");
    setCompanyInput("");
    setPhoneResults(null);
    setCompanyResults(null);
    setPhoneError("");
    setCompanyError("");
    setIsCheckingPhone(false);
    setIsCheckingCompany(false);
  }, []);

  const isSearching = isCheckingPhone || isCheckingCompany;
  const hasResults = phoneResults !== null || companyResults !== null;

  return {
    // Input states
    phoneInput,
    setPhoneInput,
    companyInput,
    setCompanyInput,

    // Results
    phoneResults,
    companyResults,
    hasResults,

    // Loading
    isCheckingPhone,
    isCheckingCompany,
    isSearching,

    // Errors
    phoneError,
    companyError,

    // Handlers
    handleCheckPhone,
    handleCheckCompany,
    handleCheckBoth,
    resetForm,
  };
};
