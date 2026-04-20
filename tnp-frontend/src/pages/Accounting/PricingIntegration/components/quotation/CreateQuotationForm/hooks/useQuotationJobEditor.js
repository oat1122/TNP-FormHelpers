import { useCallback } from "react";

import {
  computeItemTotalFallback,
  computeItemTotalsFromSizeRows,
  sumSizeRowsTotal,
} from "../../utils/itemCalculations";
import { createAppendSizeRow, createManualJob } from "../utils/jobBuilders";

export const useQuotationJobEditor = ({ setFormData, clearItemValidationErrors }) => {
  const addManualJob = useCallback(() => {
    const newJob = createManualJob();
    setFormData((prev) => ({ ...prev, items: [...prev.items, newJob] }));
    clearItemValidationErrors?.(newJob.id);
  }, [setFormData, clearItemValidationErrors]);

  const removeJob = useCallback(
    (itemId) => {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((i) => i.id !== itemId),
      }));
      clearItemValidationErrors?.(itemId);
    },
    [setFormData, clearItemValidationErrors]
  );

  const setItem = useCallback(
    (itemId, patch) => {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.map((i) => {
          if (i.id !== itemId) return i;
          const nextSizeRows = patch.sizeRows ?? i.sizeRows;
          const total = Array.isArray(nextSizeRows)
            ? sumSizeRowsTotal(nextSizeRows)
            : computeItemTotalFallback(i, patch);
          return { ...i, ...patch, total };
        }),
      }));
    },
    [setFormData]
  );

  const addSizeRow = useCallback(
    (itemId) => {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.map((i) => {
          if (i.id !== itemId) return i;
          const newRow = createAppendSizeRow(itemId, i.sizeRows?.length || 0, i.unitPrice);
          const sizeRows = [...(i.sizeRows || []), newRow];
          const { total, quantity } = computeItemTotalsFromSizeRows(sizeRows);
          return { ...i, sizeRows, total, quantity };
        }),
      }));
    },
    [setFormData]
  );

  const updateSizeRow = useCallback(
    (itemId, rowUuid, patch) => {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.map((i) => {
          if (i.id !== itemId) return i;
          const sizeRows = (i.sizeRows || []).map((r) =>
            r.uuid === rowUuid ? { ...r, ...patch } : r
          );
          const { total, quantity } = computeItemTotalsFromSizeRows(sizeRows);
          return { ...i, sizeRows, total, quantity };
        }),
      }));
    },
    [setFormData]
  );

  const removeSizeRow = useCallback(
    (itemId, rowUuid) => {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.map((i) => {
          if (i.id !== itemId) return i;
          const sizeRows = (i.sizeRows || []).filter((r) => r.uuid !== rowUuid);
          const { total, quantity } = computeItemTotalsFromSizeRows(sizeRows);
          return { ...i, sizeRows, total, quantity };
        }),
      }));
    },
    [setFormData]
  );

  const prQtyOf = useCallback((it) => {
    const q = Number(it?.originalData?.pr_quantity ?? it?.originalData?.quantity ?? 0);
    return isNaN(q) ? 0 : q;
  }, []);

  return {
    addManualJob,
    removeJob,
    setItem,
    addSizeRow,
    updateSizeRow,
    removeSizeRow,
    prQtyOf,
  };
};
