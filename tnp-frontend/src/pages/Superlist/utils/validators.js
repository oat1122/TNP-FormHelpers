/**
 * Validate supplier form data
 * @param {object} formData - Form data to validate
 * @returns {object} Validation result { isValid, errors }
 */
export const validateSupplierForm = (formData) => {
  const errors = {};

  if (!formData.sp_name || !formData.sp_name.trim()) {
    errors.sp_name = "กรุณาใส่ชื่อสินค้า";
  }

  if (!formData.sp_base_price || parseFloat(formData.sp_base_price) <= 0) {
    errors.sp_base_price = "กรุณาใส่ราคาพื้นฐานที่ถูกต้อง";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate price tiers
 * @param {array} tiers - Price tiers to validate
 * @returns {object} Validation result { isValid, errors }
 */
export const validatePriceTiers = (tiers) => {
  const errors = [];

  tiers.forEach((tier, index) => {
    if (!tier.min_qty || tier.min_qty < 0) {
      errors.push(`Tier ${index + 1}: ปริมาณขั้นต่ำไม่ถูกต้อง`);
    }
    if (tier.max_qty && tier.max_qty < tier.min_qty) {
      errors.push(`Tier ${index + 1}: ปริมาณสูงสุดต้องมากกว่าขั้นต่ำ`);
    }
    if (!tier.price || tier.price < 0) {
      errors.push(`Tier ${index + 1}: ราคาไม่ถูกต้อง`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate numeric input
 * @param {string} value - Input value to validate
 * @param {boolean} allowDecimal - Allow decimal points
 * @returns {boolean} Is valid numeric input
 */
export const validateNumericInput = (value, allowDecimal = true) => {
  if (value === "" || value === null || value === undefined) return true;
  const pattern = allowDecimal ? /^-?\d*\.?\d*$/ : /^-?\d*$/;
  return pattern.test(value);
};
