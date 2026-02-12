/**
 * Calculate tier price based on discount
 * @param {number} basePrice - Base price
 * @param {number} discount - Discount value
 * @param {string} mode - Calculation mode ('percent' or 'amount')
 * @returns {number} Calculated price
 */
export const calculateTierPrice = (basePrice, discount, mode = "percent") => {
  if (!basePrice || basePrice <= 0) return 0;

  if (mode === "percent") {
    return parseFloat((basePrice * (1 - (discount || 0) / 100)).toFixed(2));
  }

  return parseFloat((basePrice - (discount || 0)).toFixed(2));
};

/**
 * Apply pricing formula to generate tier prices
 * @param {number} basePrice - Base price in THB
 * @param {array} tiers - Tier configuration with discount
 * @param {string} mode - Calculation mode ('percent' or 'amount')
 * @returns {array} Array of calculated tier prices
 */
export const applyPricingFormula = (basePrice, tiers, mode = "percent") => {
  return tiers.map((tier) => {
    const price = calculateTierPrice(basePrice, tier.discount, mode);
    return {
      min_qty: tier.min_qty,
      max_qty: tier.max_qty,
      price: Math.max(price, 0),
      is_auto: true,
    };
  });
};

/**
 * Get tier preview price for formula dialog
 * @param {object} tier - Tier object with discount
 * @param {number} basePrice - Base price
 * @param {string} mode - Calculation mode
 * @returns {number} Preview price
 */
export const getTierPreviewPrice = (tier, basePrice, mode = "percent") => {
  return calculateTierPrice(basePrice, tier.discount, mode);
};
