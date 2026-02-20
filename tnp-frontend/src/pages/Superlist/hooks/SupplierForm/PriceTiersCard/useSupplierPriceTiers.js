import { useState } from "react";
import Swal from "sweetalert2";
import { DEFAULT_TIERS } from "../../../utils";

/**
 * Custom hook for managing price tiers and pricing formulas
 * Handles tier management, formula application, and price calculations
 */
export const useSupplierPriceTiers = (initialTiers = []) => {
  const [priceTiers, setPriceTiers] = useState(initialTiers);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [formulaMode, setFormulaMode] = useState("percent");
  const [formulaTiers, setFormulaTiers] = useState(DEFAULT_TIERS.map((t) => ({ ...t })));

  // Auto Formula — เปิด dialog
  const handleOpenFormula = (thbPrice) => {
    if (!thbPrice || thbPrice <= 0) {
      Swal.fire("", "กรุณาใส่ราคาพื้นฐาน (บาท) ก่อน", "warning");
      return;
    }
    setFormulaMode("percent");
    setFormulaTiers(DEFAULT_TIERS.map((t) => ({ ...t })));
    setFormulaOpen(true);
  };

  const getFormulaPreviewPrice = (tier, thbPrice) => {
    if (!thbPrice) return 0;
    if (formulaMode === "percent") {
      return parseFloat((thbPrice * (1 - (tier.discount || 0) / 100)).toFixed(2));
    }
    return parseFloat((thbPrice - (tier.discount || 0)).toFixed(2));
  };

  const handleFormulaTierChange = (index, value) => {
    setFormulaTiers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], discount: parseFloat(value) || 0 };
      return updated;
    });
  };

  const handleFormulaTierQtyChange = (index, field, value) => {
    setFormulaTiers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value === "" ? null : parseInt(value) };
      return updated;
    });
  };

  const handleAddFormulaTier = () => {
    const last = formulaTiers[formulaTiers.length - 1];
    setFormulaTiers((prev) => [
      ...prev,
      { min_qty: (last?.max_qty || 0) + 1, max_qty: null, discount: 0 },
    ]);
  };

  const handleRemoveFormulaTier = (index) => {
    setFormulaTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyFormula = (thbPrice) => {
    const newTiers = formulaTiers.map((tier) => {
      let price;
      if (formulaMode === "percent") {
        price = parseFloat((thbPrice * (1 - (tier.discount || 0) / 100)).toFixed(2));
      } else {
        price = parseFloat((thbPrice - (tier.discount || 0)).toFixed(2));
      }
      return {
        min_qty: tier.min_qty,
        max_qty: tier.max_qty,
        price: Math.max(price, 0),
        is_auto: true,
      };
    });
    setPriceTiers(newTiers);
    setFormulaOpen(false);
  };

  // Manual edit tier price
  const handleTierPriceChange = (index, value) => {
    const updated = [...priceTiers];
    updated[index] = {
      ...updated[index],
      price: parseFloat(value) || 0,
      is_auto: false,
    };
    setPriceTiers(updated);
  };

  const handleTierQtyChange = (index, field, value) => {
    const updated = [...priceTiers];
    updated[index] = {
      ...updated[index],
      [field]: value === "" ? null : parseInt(value),
    };
    setPriceTiers(updated);
  };

  const handleAddTier = (basePrice) => {
    const lastTier = priceTiers[priceTiers.length - 1];
    setPriceTiers([
      ...priceTiers,
      {
        min_qty: lastTier ? (lastTier.max_qty || 0) + 1 : 1,
        max_qty: null,
        price: parseFloat(basePrice) || 0,
        is_auto: false,
      },
    ]);
  };

  const handleRemoveTier = (index) => {
    setPriceTiers(priceTiers.filter((_, i) => i !== index));
  };

  return {
    // State
    priceTiers,
    setPriceTiers,
    formulaOpen,
    setFormulaOpen,
    formulaMode,
    setFormulaMode,
    formulaTiers,

    // Handlers
    handleOpenFormula,
    getFormulaPreviewPrice,
    handleFormulaTierChange,
    handleFormulaTierQtyChange,
    handleAddFormulaTier,
    handleRemoveFormulaTier,
    handleApplyFormula,
    handleTierPriceChange,
    handleTierQtyChange,
    handleAddTier,
    handleRemoveTier,
  };
};
