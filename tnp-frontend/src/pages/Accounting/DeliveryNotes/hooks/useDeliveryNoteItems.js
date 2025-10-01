import { useState } from "react";

export function useDeliveryNoteItems() {
  const [editableItems, setEditableItems] = useState([]);

  const handleUpdateItems = (updatedGroups) => {
    setEditableItems(updatedGroups);
  };

  return { editableItems, handleUpdateItems };
}
