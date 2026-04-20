import { createItemFromPR } from "./jobBuilders";
import {
  DEFAULT_DEPOSIT_PERCENTAGE,
  DEFAULT_QUOTATION_NOTES,
  DEFAULT_VAT_PERCENTAGE,
  DUE_DATE_OFFSET_DAYS,
} from "../../../../utils/pricingConstants";

export const buildEmptyFormState = () => ({
  customer: {},
  pricingRequests: [],
  items: [],
  notes: DEFAULT_QUOTATION_NOTES,
  paymentTermsType: "cash",
  paymentTermsCustom: "",
  depositMode: "percentage",
  depositPct: DEFAULT_DEPOSIT_PERCENTAGE,
  depositAmountInput: "",
  dueDate: null,
  specialDiscountType: "percentage",
  specialDiscountValue: 0,
  hasWithholdingTax: false,
  withholdingTaxPercentage: 0,
  hasVat: true,
  vatPercentage: DEFAULT_VAT_PERCENTAGE,
  pricingMode: "net",
  sampleImages: [],
  selectedSampleForPdf: "",
});

export const buildInitialFormFromPR = (selectedPricingRequests = []) => {
  const base = buildEmptyFormState();
  if (!selectedPricingRequests?.length) {
    return { ...base, pricingRequests: selectedPricingRequests };
  }

  const customer = selectedPricingRequests[0]?.customer || {};
  const items = selectedPricingRequests.map((pr, idx) => createItemFromPR(pr, idx));
  const dd = new Date();
  dd.setDate(dd.getDate() + DUE_DATE_OFFSET_DAYS);

  return {
    ...base,
    pricingRequests: selectedPricingRequests,
    customer,
    items,
    dueDate: dd,
  };
};

export const mergeInitialFromPR = (prev, selectedPricingRequests = []) => {
  if (!selectedPricingRequests?.length) return prev;
  const hydrated = buildInitialFormFromPR(selectedPricingRequests);
  return {
    ...prev,
    customer: hydrated.customer,
    items: hydrated.items,
    dueDate: hydrated.dueDate,
    paymentTermsType: "cash",
    depositPct: DEFAULT_DEPOSIT_PERCENTAGE,
  };
};
