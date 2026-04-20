// 📁shared/hooks/useQuotationGroups.js
import { useState, useMemo, useEffect, useCallback } from "react";

import { sanitizeInt, sanitizeDecimal } from "../../../../shared/inputSanitizers";

// Hook to manage groups editing state and helpers used in QuotationDetailDialog / QuotationDuplicateDialog
export function useQuotationGroups(initialItems) {
  const [groups, setGroups] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const editableInitialGroups = useMemo(
    () =>
      (initialItems || []).map((g) => ({
        ...g,
        sizeRows: (g.sizeRows || []).map((r) => ({ ...r })),
      })),
    [initialItems]
  );

  useEffect(() => {
    // Initialize editable groups on open or when quotation changes
    setGroups(editableInitialGroups);
    setIsEditing(false);
  }, [editableInitialGroups]);

  const onAddRow = useCallback((groupId) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const newRow = {
          uuid: `${groupId}-${Date.now()}`,
          size: "",
          quantity: "",
          unitPrice: "",
          notes: "",
        };
        return { ...g, sizeRows: [...(g.sizeRows || []), newRow] };
      })
    );
  }, []);

  const onChangeRow = useCallback((groupId, rowUuid, field, value) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const rows = (g.sizeRows || []).map((r) => {
          if (r.uuid !== rowUuid) return r;
          if (field === "size") return { ...r, size: value };
          if (field === "quantity") return { ...r, quantity: sanitizeInt(value) };
          if (field === "unitPrice") return { ...r, unitPrice: sanitizeDecimal(value) };
          return { ...r, [field]: value };
        });
        return { ...g, sizeRows: rows };
      })
    );
  }, []);

  const onRemoveRow = useCallback((groupId, rowUuid) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const rows = (g.sizeRows || []).filter((r) => r.uuid !== rowUuid);
        return { ...g, sizeRows: rows };
      })
    );
  }, []);

  const onDeleteGroup = useCallback((groupId) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  const onChangeGroup = useCallback((groupId, field, value) => {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, [field]: value } : g)));
  }, []);

  const onAddNewGroup = useCallback(() => {
    const newGroup = {
      id: `manual_${Date.now()}`,
      isManual: true,
      isFromPR: false,
      prId: null,
      name: "",
      pattern: "",
      fabricType: "",
      color: "",
      size: "",
      unit: "ชิ้น",
      sizeRows: [
        {
          uuid: `manual_${Date.now()}_row_1`,
          size: "",
          quantity: "",
          unitPrice: "",
          notes: "",
        },
      ],
    };
    setGroups((prev) => [...prev, newGroup]);
  }, []);

  return {
    groups,
    setGroups,
    isEditing,
    setIsEditing,
    onAddRow,
    onChangeRow,
    onRemoveRow,
    onDeleteGroup,
    onChangeGroup,
    onAddNewGroup,
  };
}
