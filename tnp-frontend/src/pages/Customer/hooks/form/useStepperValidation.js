import { useState } from "react";
import { STEP_REQUIRED_FIELDS } from "../../constants/validationConstants";

export const useStepperValidation = () => {
  const [errors, setErrors] = useState({});

  // ใช้ constants กลาง (Single Source of Truth)
  const stepRequiredFields = STEP_REQUIRED_FIELDS;

  // คำนวณสถานะของแต่ละ step
  const calculateStepStatus = (stepIndex, inputList) => {
    const requiredFields = stepRequiredFields[stepIndex] || [];
    const stepErrors = requiredFields.filter((field) => errors[field]);
    const completedFields = requiredFields.filter((field) => {
      const value = inputList[field];
      return value !== undefined && value !== null && value !== "";
    });

    if (stepErrors.length > 0) {
      return "error"; // มีข้อผิดพลาด
    } else if (completedFields.length === requiredFields.length) {
      return "completed"; // เสร็จสมบูรณ์
    } else if (completedFields.length > 0) {
      return "warning"; // กรอกบางส่วน
    } else {
      return "pending"; // ยังไม่ได้กรอก
    }
  };

  // คำนวณ completed steps และ error steps
  const getStepStatuses = (inputList) => {
    const completedSteps = [];
    const errorSteps = [];

    for (let i = 0; i < 4; i++) {
      const status = calculateStepStatus(i, inputList);
      if (status === "completed") {
        completedSteps.push(i);
      } else if (status === "error") {
        errorSteps.push(i);
      }
    }

    return { completedSteps, errorSteps };
  };

  // ตรวจสอบว่า step ปัจจุบันเสร็จสมบูรณ์หรือไม่
  const isStepComplete = (stepIndex, inputList) => {
    const requiredFields = stepRequiredFields[stepIndex] || [];

    // ตรวจสอบ required fields
    const missingFields = requiredFields.filter((field) => {
      const value = inputList[field];
      return !value || value === "";
    });

    // ตรวจสอบ errors
    const stepErrors = requiredFields.filter((field) => errors[field]);

    return missingFields.length === 0 && stepErrors.length === 0;
  };

  // ตรวจสอบว่าสามารถไปยัง step ถัดไปได้หรือไม่
  const canNavigateToStep = (targetStep, currentStep, inputList) => {
    // สามารถกลับไปขั้นตอนก่อนหน้าได้เสมอ
    if (targetStep <= currentStep) {
      return true;
    }

    // ตรวจสอบว่าขั้นตอนก่อนหน้าเสร็จสมบูรณ์หรือไม่
    for (let i = currentStep; i < targetStep; i++) {
      if (!isStepComplete(i, inputList)) {
        return false;
      }
    }

    return true;
  };

  // Validate form สำหรับขั้นตอนปัจจุบัน
  const validateCurrentStep = (stepIndex, inputList, formRef) => {
    const requiredFields = stepRequiredFields[stepIndex] || [];
    const newErrors = {};

    // ตรวจสอบ business type แบบพิเศษ (ไม่อยู่ใน form)
    if (stepIndex === 0 && !inputList.cus_bt_id) {
      newErrors.cus_bt_id = "กรุณาเลือกประเภทธุรกิจ";
    }

    // ตรวจสอบ form validation
    if (formRef?.current) {
      const form = formRef.current;
      const invalidInputs = form.querySelectorAll(":invalid");

      invalidInputs.forEach((input) => {
        // เฉพาะ fields ที่อยู่ในขั้นตอนปัจจุบัน
        if (requiredFields.includes(input.name)) {
          newErrors[input.name] = input.validationMessage;
        }
      });
    }

    // ตรวจสอบ required fields manually
    requiredFields.forEach((field) => {
      const value = inputList[field];
      if (!value || value === "") {
        newErrors[field] = "กรุณากรอกข้อมูลนี้";
      }
    });

    setErrors((prev) => ({ ...prev, ...newErrors }));

    return Object.keys(newErrors).length === 0;
  };

  // Validate form ทั้งหมด
  const validateAllSteps = (inputList, formRef) => {
    const allRequiredFields = Object.values(stepRequiredFields).flat();
    const newErrors = {};

    // ตรวจสอบ business type
    if (!inputList.cus_bt_id) {
      newErrors.cus_bt_id = "กรุณาเลือกประเภทธุรกิจ";
    }

    // ตรวจสอบ form validation
    if (formRef?.current) {
      const form = formRef.current;
      if (!form.checkValidity()) {
        const invalidInputs = form.querySelectorAll(":invalid");
        invalidInputs.forEach((input) => {
          newErrors[input.name] = input.validationMessage;
        });
      }
    }

    // ตรวจสอบ required fields manually
    allRequiredFields.forEach((field) => {
      const value = inputList[field];
      if (!value || value === "") {
        newErrors[field] = "กรุณากรอกข้อมูลนี้";
      }
    });

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // หา step แรกที่มีข้อผิดพลาด
  const getFirstErrorStep = (inputList) => {
    for (let i = 0; i < 4; i++) {
      if (!isStepComplete(i, inputList)) {
        return i;
      }
    }
    return 0;
  };

  // Clear specific field error
  const clearFieldError = (fieldName) => {
    setErrors((prev) => ({ ...prev, [fieldName]: "" }));
  };

  // Clear all errors
  const clearAllErrors = () => {
    setErrors({});
  };

  // คำนวณ progress percentage
  const calculateProgress = (inputList) => {
    const allRequiredFields = Object.values(stepRequiredFields).flat();
    const completedFields = allRequiredFields.filter((field) => {
      const value = inputList[field];
      return value !== undefined && value !== null && value !== "";
    });

    return allRequiredFields.length > 0
      ? Math.round((completedFields.length / allRequiredFields.length) * 100)
      : 0;
  };

  return {
    errors,
    setErrors,
    stepRequiredFields,
    calculateStepStatus,
    getStepStatuses,
    isStepComplete,
    canNavigateToStep,
    validateCurrentStep,
    validateAllSteps,
    getFirstErrorStep,
    clearFieldError,
    clearAllErrors,
    calculateProgress,
  };
};
