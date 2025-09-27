import { useMemo } from "react";

/**
 * Invoice validation hook for form validation and warnings
 */
export function useInvoiceValidation({ items = [], originalInvoice = null, formData = {} }) {
  return useMemo(() => {
    const warnings = [];
    const errors = [];

    // Validate items
    items.forEach((item, index) => {
      if (Array.isArray(item.sizeRows)) {
        // Validate size rows
        item.sizeRows.forEach((row, rowIndex) => {
          const qty = Number(row.quantity || 0);
          const unitPrice = Number(row.unitPrice || 0);

          // Check for negative values
          if (qty < 0) {
            errors.push(`รายการที่ ${index + 1} แถวที่ ${rowIndex + 1}: จำนวนต้องไม่ติดลบ`);
          }
          if (unitPrice < 0) {
            errors.push(`รายการที่ ${index + 1} แถวที่ ${rowIndex + 1}: ราคาต่อหน่วยต้องไม่ติดลบ`);
          }
        });

        // Check total quantity mismatch with original work
        if (originalInvoice && item.originalQuantity) {
          const totalQty = item.sizeRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
          const originalQty = Number(item.originalQuantity || 0);

          if (totalQty !== originalQty) {
            warnings.push({
              type: "quantity_mismatch",
              message: `งานที่ ${index + 1}: จำนวนรวม ${totalQty} ไม่ตรงกับงานหลัก ${originalQty}`,
              itemIndex: index,
              totalQty,
              originalQty,
            });
          }
        }
      } else {
        // Validate simple item
        const qty = Number(item.quantity || 0);
        const unitPrice = Number(item.unit_price || item.unitPrice || 0);

        if (qty < 0) {
          errors.push(`รายการที่ ${index + 1}: จำนวนต้องไม่ติดลบ`);
        }
        if (unitPrice < 0) {
          errors.push(`รายการที่ ${index + 1}: ราคาต่อหน่วยต้องไม่ติดลบ`);
        }
      }
    });

    // Validate financial fields
    const discountValue = Number(
      formData.special_discount_percentage || formData.special_discount_amount || 0
    );
    const vatPercentage = Number(formData.vat_percentage || 0);
    const whtPercentage = Number(formData.withholding_tax_percentage || 0);
    const depositPercentage = Number(formData.deposit_percentage || 0);
    const depositAmount = Number(formData.deposit_amount || 0);

    // Check for negative financial values
    if (discountValue < 0) {
      errors.push("ส่วนลดต้องไม่ติดลบ");
    }
    if (vatPercentage < 0) {
      errors.push("อัตราภาษีมูลค่าเพิ่มต้องไม่ติดลบ");
    }
    if (whtPercentage < 0) {
      errors.push("อัตราภาษีหัก ณ ที่จ่ายต้องไม่ติดลบ");
    }
    if (depositPercentage < 0) {
      errors.push("เปอร์เซ็นต์มัดจำต้องไม่ติดลบ");
    }
    if (depositAmount < 0) {
      errors.push("จำนวนเงินมัดจำต้องไม่ติดลบ");
    }

    // Check for excessive percentages
    if (vatPercentage > 100) {
      warnings.push({
        type: "high_percentage",
        message: "อัตราภาษีมูลค่าเพิ่มสูงกว่า 100%",
      });
    }
    if (whtPercentage > 100) {
      warnings.push({
        type: "high_percentage",
        message: "อัตราภาษีหัก ณ ที่จ่ายสูงกว่า 100%",
      });
    }
    if (depositPercentage > 100) {
      warnings.push({
        type: "high_percentage",
        message: "เปอร์เซ็นต์มัดจำสูงกว่า 100%",
      });
    }

    // Check if invoice is in read-only state
    const status = formData.status || originalInvoice?.status;
    const isReadOnly = status === "approved" || status === "fully_paid";

    return {
      warnings,
      errors,
      isValid: errors.length === 0,
      hasWarnings: warnings.length > 0,
      isReadOnly,
    };
  }, [items, originalInvoice, formData]);
}

/**
 * Helper function to sanitize numeric input values
 */
export function sanitizeNumericInput(value, min = 0, max = Infinity) {
  const num = Number(value || 0);
  if (isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
}

/**
 * Helper function to sanitize integer input values
 */
export function sanitizeIntegerInput(value, min = 0, max = Infinity) {
  const num = parseInt(value || 0, 10);
  if (isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
}
