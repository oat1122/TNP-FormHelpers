import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

import { addNotification, setFilters } from "../../../../features/Accounting/accountingSlice";
import { DEFAULT_PRICING_PAGE_SIZE } from "../utils/pricingConstants";

const FORM_TRANSITION_DELAY_MS = 100;

export const usePricingIntegrationState = () => {
  const dispatch = useDispatch();

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PRICING_PAGE_SIZE);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPricingRequest, setSelectedPricingRequest] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPricingRequests, setSelectedPricingRequests] = useState([]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerOverrides, setCustomerOverrides] = useState({});

  const handleSearch = useCallback(
    (query) => {
      setSearchTerm(query);
      setCurrentPage(1);
      dispatch(setFilters({ searchQuery: query }));
    },
    [dispatch]
  );

  const handlePageChange = useCallback((_event, newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  const handleShowOnlyMineChange = useCallback((checked) => {
    setShowOnlyMine(checked);
  }, []);

  const handleViewModeChange = useCallback((_event, value) => {
    if (value) setViewMode(value);
  }, []);

  const handleCreateQuotation = useCallback((group) => {
    const targetRequest = group.requests.find((r) => !r.is_quoted) || group.requests[0];
    const dataForModal = {
      ...(targetRequest || {}),
      customer: group.customer || {},
    };
    setSelectedPricingRequest(dataForModal);
    setShowCreateModal(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => setShowCreateModal(false), []);

  const handleQuotationFromModal = useCallback(
    (data, availableRequests = []) => {
      try {
        setShowCreateModal(false);

        const selectedRequests = [];
        if (data.pricingRequestIds && data.pricingRequestIds.length > 0) {
          data.pricingRequestIds.forEach((prId) => {
            const foundRequest = availableRequests.find((pr) => pr.pr_id === prId);
            if (foundRequest) {
              selectedRequests.push(foundRequest);
            } else if (import.meta.env.DEV) {
              console.error(`❌ Could not find PR with ID: ${prId}`);
            }
          });
        }

        if (selectedRequests.length === 0) {
          if (import.meta.env.DEV) {
            console.error("❌ No matching pricing requests found!");
          }
          dispatch(
            addNotification({
              type: "error",
              title: "เกิดข้อผิดพลาด",
              message: "ไม่พบข้อมูลงานที่เลือก กรุณาลองใหม่",
            })
          );
          return;
        }

        if (data.selectedRequestsData && data.selectedRequestsData.length > 0) {
          setSelectedPricingRequests(data.selectedRequestsData);
        } else {
          const requestsWithCustomer = selectedRequests.map((req) => ({
            ...req,
            customer: data.customer || req.customer || {},
          }));
          setSelectedPricingRequests(requestsWithCustomer);
        }

        setTimeout(() => {
          setShowCreateForm(true);
        }, FORM_TRANSITION_DELAY_MS);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("❌ Error preparing quotation form:", error);
        }
        dispatch(
          addNotification({
            type: "error",
            title: "เกิดข้อผิดพลาด",
            message: "เกิดข้อผิดพลาดในการเตรียมข้อมูล กรุณาลองใหม่",
          })
        );
      }
    },
    [dispatch]
  );

  const handleBackFromForm = useCallback(() => {
    setShowCreateForm(false);
    setSelectedPricingRequests([]);
  }, []);

  const resetAfterCreateSuccess = useCallback(() => {
    setShowCreateForm(false);
    setSelectedPricingRequests([]);
  }, []);

  const handleEditCustomer = useCallback((group) => {
    setEditingCustomer(group.customer || {});
    setEditDialogOpen(true);
  }, []);

  const handleCloseEditDialog = useCallback(() => setEditDialogOpen(false), []);

  const handleCustomerUpdated = useCallback((updated) => {
    if (!updated?.cus_id) return;
    setCustomerOverrides((prev) => ({
      ...prev,
      [String(updated.cus_id)]: updated,
    }));
  }, []);

  return {
    searchTerm,
    showOnlyMine,
    currentPage,
    itemsPerPage,
    viewMode,
    showCreateModal,
    selectedPricingRequest,
    showCreateForm,
    selectedPricingRequests,
    editDialogOpen,
    editingCustomer,
    customerOverrides,
    handleSearch,
    handlePageChange,
    handleItemsPerPageChange,
    handleShowOnlyMineChange,
    handleViewModeChange,
    handleCreateQuotation,
    handleCloseCreateModal,
    handleQuotationFromModal,
    handleBackFromForm,
    resetAfterCreateSuccess,
    handleEditCustomer,
    handleCloseEditDialog,
    handleCustomerUpdated,
  };
};
