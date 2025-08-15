import React from 'react';
import { sanitizeInt, sanitizeDecimal } from '../../shared/inputSanitizers';

// Hook to manage groups editing state and helpers used in QuotationDetailDialog
export function useQuotationGroups(initialItems) {
  const [groups, setGroups] = React.useState([]);
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    // Initialize editable groups on open or when quotation changes
    const editable = (initialItems || []).map((g) => ({
      ...g,
      sizeRows: (g.sizeRows || []).map((r) => ({ ...r })),
    }));
    setGroups(editable);
    setIsEditing(false);
  }, [JSON.stringify(initialItems)]); // shallow-safe since items are small

  const onAddRow = React.useCallback((groupId) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const newRow = { uuid: `${groupId}-${Date.now()}`, size: '', quantity: '', unitPrice: '', notes: '' };
        return { ...g, sizeRows: [...(g.sizeRows || []), newRow] };
      })
    );
  }, []);

  const onChangeRow = React.useCallback((groupId, rowUuid, field, value) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const rows = (g.sizeRows || []).map((r) => {
          if (r.uuid !== rowUuid) return r;
          if (field === 'size') return { ...r, size: value };
          if (field === 'quantity') return { ...r, quantity: sanitizeInt(value) };
          if (field === 'unitPrice') return { ...r, unitPrice: sanitizeDecimal(value) };
          return { ...r, [field]: value };
        });
        return { ...g, sizeRows: rows };
      })
    );
  }, []);

  const onRemoveRow = React.useCallback((groupId, rowUuid) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const rows = (g.sizeRows || []).filter((r) => r.uuid !== rowUuid);
        return { ...g, sizeRows: rows };
      })
    );
  }, []);

  const onDeleteGroup = React.useCallback((groupId) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  const onChangeGroup = React.useCallback((groupId, field, value) => {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, [field]: value } : g)));
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
  };
}
