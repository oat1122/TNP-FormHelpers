import { useState } from "react";
import Swal from "sweetalert2";

export const useCustomizationCard = ({
  options,
  setOptions,
  priceTiers = [],
  currency = "THB",
  exchangeRate = 1,
}) => {
  const [editingOptionIndex, setEditingOptionIndex] = useState(null);
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [currentOption, setCurrentOption] = useState({
    spo_name: "",
    tiers: [], // Will store { min_qty, max_qty, price }
  });

  // State for Option Pricing (in Dialog)
  const [optBasePrice, setOptBasePrice] = useState("");
  const [optScaleMode, setOptScaleMode] = useState("percent");
  const [optCurrency, setOptCurrency] = useState("THB");
  const [optPriceTHB, setOptPriceTHB] = useState("");

  const [isViewingOption, setIsViewingOption] = useState(false);

  // Sync tiers when opening dialog
  const prepareTiers = (existingTiers = []) => {
    // We strictly follow priceTiers structure
    return priceTiers.map((pt) => {
      // Find valid price from existingTiers if min/max match
      const existing = existingTiers.find(
        (et) =>
          (et.min_qty === pt.min_qty || et.spot_min_qty === pt.min_qty) &&
          (et.max_qty === pt.max_qty || et.spot_max_qty === pt.max_qty)
      );
      return {
        min_qty: pt.min_qty,
        max_qty: pt.max_qty,
        price: existing ? existing.price || existing.spot_price || 0 : 0,
        discount: existing
          ? existing.discount !== undefined
            ? existing.discount
            : existing.spot_discount !== undefined && existing.spot_discount !== null
              ? existing.spot_discount
              : ""
          : "",
      };
    });
  };

  const handleAddOption = () => {
    if (priceTiers.length === 0) {
      // Alert user to set main tiers first
      Swal.fire("", "กรุณาตั้งค่าขั้นบันไดราคาหลัก (Price Scaling) ก่อนเพิ่มตัวเลือก", "warning");
      return;
    }

    setCurrentOption({
      spo_name: "",
      tiers: prepareTiers([]),
    });
    setOptBasePrice("");
    setOptScaleMode("percent");
    setOptCurrency(currency); // Default to product currency
    setOptPriceTHB("");
    setEditingOptionIndex(null);
    setIsViewingOption(false);
    setOptionDialogOpen(true);
  };

  const handleEditOption = (index) => {
    const opt = options[index];
    setCurrentOption({
      ...opt,
      tiers: prepareTiers(opt.tiers),
    });
    setOptBasePrice(opt.spo_base_price || "");
    setOptCurrency(currency);
    setOptPriceTHB(opt.tiers?.[0]?.price || "");
    setOptScaleMode(opt.spo_scale_mode || "percent");
    setEditingOptionIndex(index);
    setIsViewingOption(false);
    setOptionDialogOpen(true);
  };

  const handleViewOption = (index) => {
    const opt = options[index];
    setCurrentOption({
      ...opt,
      tiers: prepareTiers(opt.tiers),
    });
    setOptBasePrice(opt.spo_base_price || "");
    setOptCurrency(currency);
    setOptPriceTHB(opt.tiers?.[0]?.price || "");
    setOptScaleMode(opt.spo_scale_mode || "percent");
    setEditingOptionIndex(index);
    setIsViewingOption(true);
    setOptionDialogOpen(true);
  };

  const handleRemoveOption = (index) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleSaveOption = () => {
    if (!currentOption.spo_name.trim()) return;

    const optPayload = {
      ...currentOption,
      spo_base_price: optBasePrice || null,
      spo_scale_mode: optScaleMode || "percent",
    };

    const newOptions = [...options];
    if (editingOptionIndex !== null) {
      newOptions[editingOptionIndex] = optPayload;
    } else {
      newOptions.push({ ...optPayload, spo_is_active: true });
    }
    setOptions(newOptions);
    setOptionDialogOpen(false);
  };

  // Logic for Auto Formula (Simple: Apply THB Price to all tiers)
  // Or if we want scaling, we can implement it.
  // For now, let's just implement "Convert Base to THB" and "Apply to All"
  const handleConvert = () => {
    if (!optBasePrice || isNaN(optBasePrice)) return;
    if (optCurrency === "THB") {
      setOptPriceTHB(optBasePrice);
    } else {
      const rate = parseFloat(exchangeRate) || 1;
      const val = parseFloat(optBasePrice) * rate;
      setOptPriceTHB(val.toFixed(2));
    }
  };

  const handleAutoFormula = (baseProductPrice) => {
    if (!optPriceTHB || !baseProductPrice) return;
    const baseOptPrice = parseFloat(optPriceTHB);
    const baseProdPrice = parseFloat(baseProductPrice);

    setOptScaleMode("percent");

    const updatedTiers = currentOption.tiers.map((t) => {
      // Find matching main product tier to get its discount %
      const matchingMainTier = priceTiers.find(
        (pt) => pt.min_qty === t.min_qty && pt.max_qty === t.max_qty
      );

      let discountPercent = 0;
      if (matchingMainTier && matchingMainTier.price > 0 && baseProdPrice > 0) {
        // Calculate the effective discount percentage of the main product tier
        // formula: 1 - (tierPrice / basePrice)
        discountPercent = (1 - matchingMainTier.price / baseProdPrice) * 100;
        if (discountPercent < 0) discountPercent = 0;
      }

      let newPrice = baseOptPrice - (baseOptPrice * discountPercent) / 100;
      if (newPrice < 0) newPrice = 0;

      return {
        ...t,
        discount: discountPercent > 0 ? discountPercent.toFixed(2).replace(/\.00$/, "") : "0",
        price: newPrice.toFixed(2).replace(/\.00$/, ""),
      };
    });

    setCurrentOption({ ...currentOption, tiers: updatedTiers });
  };

  const handleScaleModeChange = (mode) => {
    setOptScaleMode(mode);
    // Reset discount column when switching modes
    const updatedTiers = currentOption.tiers.map((t) => ({ ...t, discount: "" }));
    setCurrentOption({ ...currentOption, tiers: updatedTiers });
  };

  const handleTierDiscountChange = (idx, val) => {
    const newTiers = [...currentOption.tiers];
    const discountVal = parseFloat(val) || 0;
    const baseThb = parseFloat(optPriceTHB) || 0;
    let newPrice = baseThb;

    if (val !== "") {
      if (optScaleMode === "percent") {
        newPrice = baseThb - (baseThb * discountVal) / 100;
      } else {
        newPrice = baseThb - discountVal;
      }
    }

    if (newPrice < 0) newPrice = 0;

    newTiers[idx] = {
      ...newTiers[idx],
      discount: val,
      price: val === "" ? "" : newPrice.toFixed(2).replace(/\.00$/, ""),
    };
    setCurrentOption({ ...currentOption, tiers: newTiers });
  };

  // Handle manual price edit in table
  const handleTierPriceChange = (idx, val) => {
    const newTiers = [...currentOption.tiers];
    // If they manually edit the final price, optionally clear the discount field to avoid confusion
    newTiers[idx] = { ...newTiers[idx], price: val, discount: "" };
    setCurrentOption({ ...currentOption, tiers: newTiers });
  };

  return {
    editingOptionIndex,
    optionDialogOpen,
    setOptionDialogOpen,
    isViewingOption,
    currentOption,
    setCurrentOption,
    optBasePrice,
    setOptBasePrice,
    optScaleMode,
    optCurrency,
    optPriceTHB,
    setOptPriceTHB,
    handleAddOption,
    handleEditOption,
    handleViewOption,
    handleRemoveOption,
    handleSaveOption,
    handleConvert,
    handleAutoFormula,
    handleScaleModeChange,
    handleTierDiscountChange,
    handleTierPriceChange,
  };
};
