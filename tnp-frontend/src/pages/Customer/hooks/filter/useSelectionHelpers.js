import { useCallback } from "react";

/**
 * Custom hook for managing selection helpers
 * Handles sales and channel multi-select operations
 */
export const useSelectionHelpers = (setDraftFilters, salesList) => {
  // Handle sales selection - we now work directly with draftFilters
  const handleSalesChange = useCallback(
    (e) => {
      const value = e.target.value;
      setDraftFilters((prev) => ({
        ...prev,
        salesName: typeof value === "string" ? value.split(",") : value,
      }));
    },
    [setDraftFilters]
  );

  // Handle channel selection - we now work directly with draftFilters
  const handleChannelChange = useCallback(
    (e) => {
      const value = e.target.value;
      setDraftFilters((prev) => ({
        ...prev,
        channel: typeof value === "string" ? value.split(",") : value,
      }));
    },
    [setDraftFilters]
  );

  // Select all sales handler
  const selectAllSales = useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      salesName: [...salesList],
    }));
  }, [salesList, setDraftFilters]);

  // Clear sales selection handler
  const clearSalesSelection = useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      salesName: [],
    }));
  }, [setDraftFilters]);

  // Select all channels handler
  const selectAllChannels = useCallback(
    (channelOptions) => {
      setDraftFilters((prev) => ({
        ...prev,
        channel: channelOptions.map((option) => option.value),
      }));
    },
    [setDraftFilters]
  );

  // Clear channel selection handler
  const clearChannelSelection = useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      channel: [],
    }));
  }, [setDraftFilters]);

  // Toggle single sales selection
  const toggleSalesSelection = useCallback(
    (salesName) => {
      setDraftFilters((prev) => {
        const currentSales = prev.salesName || [];
        const isSelected = currentSales.includes(salesName);

        return {
          ...prev,
          salesName: isSelected
            ? currentSales.filter((name) => name !== salesName)
            : [...currentSales, salesName],
        };
      });
    },
    [setDraftFilters]
  );

  // Toggle single channel selection
  const toggleChannelSelection = useCallback(
    (channelValue) => {
      setDraftFilters((prev) => {
        const currentChannels = prev.channel || [];
        const isSelected = currentChannels.includes(channelValue);

        return {
          ...prev,
          channel: isSelected
            ? currentChannels.filter((value) => value !== channelValue)
            : [...currentChannels, channelValue],
        };
      });
    },
    [setDraftFilters]
  );

  return {
    // Sales handlers
    handleSalesChange,
    selectAllSales,
    clearSalesSelection,
    toggleSalesSelection,

    // Channel handlers
    handleChannelChange,
    selectAllChannels,
    clearChannelSelection,
    toggleChannelSelection,
  };
};
