import React, { useState, useEffect } from "react";
import "./MaxSupplyList.css";
import {
  Box,
  Container,
  Typography,
  Chip,
  Button,
  useTheme,
  useMediaQuery,
  Pagination,
  Stack,
  Fab,
} from "@mui/material";
import {
  FaPlus,
  FaChartLine,
  FaSortAmountDown,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { differenceInDays } from "date-fns";
import ProductionTypeIcon from "./components/ProductionTypeIcon";
import {
  productionTypeConfig,
  statusConfig,
  priorityConfig,
} from "./utils/constants";
import { maxSupplyApi } from "../../services/maxSupplyApi";
import MaxSupplyEditForm from "./MaxSupplyEditForm";
import {
  FilterBar,
  MobileCardView,
  DesktopTableView,
  DetailDialog,
  DeleteConfirmDialog,
  LoadingSkeleton,
  EmptyState,
} from "./components/UI";

const MaxSupplyList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));
  const navigate = useNavigate();

  const [maxSupplies, setMaxSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState(isMobile ? "card" : "table");
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    production_type: "all",
    priority: "all",
    date_from: "",
    date_to: "",
    overdue_only: false,
    urgent_only: false,
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Helper functions for better date handling and status indicators
  const getDaysUntilDeadline = (expectedDate) => {
    if (!expectedDate) return null;
    return differenceInDays(new Date(expectedDate), new Date());
  };

  const getDeadlineStatus = (expectedDate) => {
    const days = getDaysUntilDeadline(expectedDate);
    if (days === null) return "none";
    if (days < 0) return "overdue";
    if (days <= 2) return "urgent";
    if (days <= 7) return "warning";
    return "normal";
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return "success";
    if (percentage >= 50) return "warning";
    return "error";
  };

  // Enhanced Production type colors and icons
  const productionColors = {
    screen: productionTypeConfig.screen.color,
    dtf: productionTypeConfig.dtf.color,
    sublimation: productionTypeConfig.sublimation.color,
    embroidery: productionTypeConfig.embroidery.color,
  };

  const getProductionTypeIcon = (type) => {
    return <ProductionTypeIcon type={type} size={20} />;
  };

  // Enhanced Status colors and labels
  const statusColors = {
    pending: statusConfig.pending.color,
    in_progress: statusConfig.in_progress.color,
    completed: statusConfig.completed.color,
    cancelled: statusConfig.cancelled.color,
  };

  const statusLabels = {
    pending: statusConfig.pending.label,
    in_progress: statusConfig.in_progress.label,
    completed: statusConfig.completed.label,
    cancelled: statusConfig.cancelled.label,
  };

  // Status labels with emoji for mobile
  const statusLabelsWithEmoji = {
    pending: "รอเริ่ม",
    in_progress: "กำลังผลิต",
    completed: "เสร็จสิ้น",
    cancelled: "ยกเลิก",
  };

  const priorityLabels = {
    low: priorityConfig.low.label,
    normal: priorityConfig.normal.label,
    high: priorityConfig.high.label,
    urgent: priorityConfig.urgent.label,
  };

  const priorityColors = {
    low: priorityConfig.low.color,
    normal: priorityConfig.normal.color,
    high: priorityConfig.high.color,
    urgent: priorityConfig.urgent.color,
  };

  // Load data with enhanced sorting and filtering
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Filter out "all" values and empty values before sending to API
      const filteredParams = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => {
          // Remove "all" values for status, production_type, priority
          if (["status", "production_type", "priority"].includes(key)) {
            return value !== "all" && value !== "";
          }
          // Remove empty string values for other filters
          if (typeof value === "string") {
            return value.trim() !== "";
          }
          // Keep boolean values as they are
          if (typeof value === "boolean") {
            return value === true; // Only send true values for boolean filters
          }
          return value !== null && value !== undefined;
        })
      );

      const params = {
        page,
        per_page: 10,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...filteredParams,
      };

      // Debug: Log all filters and final params
      console.log("Current filters state:", filters);
      console.log("Filter params being sent to API:", params);
      
      const response = await maxSupplyApi.getAll(params);
      setMaxSupplies(response.data || []);
      setTotalPages(response.meta?.last_page || 1);
      setTotalItems(response.meta?.total || 0);
    } catch (error) {
      console.error("Error loading data:", error);
      setMaxSupplies([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter change with debounce for search
  const handleFilterChange = (name, value) => {
    console.log(`Filter changed: ${name} = ${value}`);
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPage(1);
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadData();
  };

  // Handle delete with confirmation dialog
  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteConfirmDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      try {
        await maxSupplyApi.delete(itemToDelete.id);
        setDeleteConfirmDialog(false);
        setItemToDelete(null);
        loadData();
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  // Handle view detail
  const handleViewDetail = async (id) => {
    try {
      const response = await maxSupplyApi.getById(id);
      setSelectedItem(response.data);
      setDetailDialog(true);
    } catch (error) {
      console.error("Error loading detail:", error);
    }
  };

  // Handle edit
  const handleEditClick = async (item) => {
    try {
      setEditItem(item);
      setEditDialog(true);
    } catch (error) {
      console.error("Error setting edit item:", error);
    }
  };

  // Handle save edit
  const handleSaveEdit = async (updatedItem) => {
    try {
      console.log("Attempting to save updated item:", updatedItem);
      console.log("Item to edit:", editItem);
      
      // Make sure we have the correct ID
      const itemId = editItem?.id;
      if (!itemId) {
        console.error("No item ID found for update");
        return;
      }
      
      const response = await maxSupplyApi.update(itemId, updatedItem);
      console.log("Update response:", response);
      setEditDialog(false);
      setEditItem(null);
      loadData();
    } catch (error) {
      console.error("Error saving edit:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Updated item data:", updatedItem);
    }
  };

  // Handle close edit dialog
  const handleCloseEdit = () => {
    setEditDialog(false);
    setEditItem(null);
  };

  useEffect(() => {
    loadData();
  }, [page, filters, sortBy, sortOrder]);

  useEffect(() => {
    setViewMode(isMobile ? "card" : "table");
  }, [isMobile]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header with enhanced styling */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              background: "linear-gradient(45deg, #B20000, #E36264)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            รายการงานผลิต MaxSupply
          </Typography>
          {!isMobile && (
            <Chip
              label={`ทั้งหมด ${totalItems} งาน`}
              variant="outlined"
              color="primary"
              sx={{ fontSize: "0.9rem", fontWeight: "bold" }}
            />
          )}
        </Box>

        {/* Statistics Summary */}
        {totalItems > 0 && (
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
            <Chip
              label={`รอเริ่ม: ${
                maxSupplies.filter((item) => item.status === "pending").length
              }`}
              color="warning"
              size="small"
            />
            <Chip
              label={`กำลังผลิต: ${
                maxSupplies.filter((item) => item.status === "in_progress")
                  .length
              }`}
              color="primary"
              size="small"
            />
            <Chip
              label={`เสร็จสิ้น: ${
                maxSupplies.filter((item) => item.status === "completed").length
              }`}
              color="success"
              size="small"
            />
            <Chip
              label={`ใกล้ครบกำหนด: ${
                maxSupplies.filter(
                  (item) =>
                    getDeadlineStatus(item.expected_completion_date) ===
                      "urgent" ||
                    getDeadlineStatus(item.expected_completion_date) ===
                      "overdue"
                ).length
              }`}
              color="error"
              size="small"
            />
          </Box>
        )}
      </Box>

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        filterExpanded={filterExpanded}
        onFilterExpandedChange={setFilterExpanded}
        totalItems={totalItems}
        maxSupplies={maxSupplies}
        getDeadlineStatus={getDeadlineStatus}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {/* Main Content Area */}
      {loading ? (
        <LoadingSkeleton />
      ) : maxSupplies.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* View Toggle for Tablet/Desktop */}
          {!isMobile && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant={viewMode === "table" ? "contained" : "outlined"}
                  onClick={() => setViewMode("table")}
                  size="small"
                  startIcon={<FaSortAmountDown />}
                >
                  ตารางข้อมูล
                </Button>
                <Button
                  variant={viewMode === "card" ? "contained" : "outlined"}
                  onClick={() => setViewMode("card")}
                  size="small"
                  startIcon={<FaChartLine />}
                >
                  การ์ดข้อมูล
                </Button>
              </Stack>
            </Box>
          )}

          {/* Data Display */}
          {viewMode === "card" ? (
            <MobileCardView
              maxSupplies={maxSupplies}
              getDeadlineStatus={getDeadlineStatus}
              getDaysUntilDeadline={getDaysUntilDeadline}
              getProductionTypeIcon={getProductionTypeIcon}
              statusColors={statusColors}
              statusLabelsWithEmoji={statusLabelsWithEmoji}
              productionColors={productionColors}
              onViewDetail={handleViewDetail}
              onEditClick={handleEditClick}
              onDeleteClick={handleDeleteClick}
            />
          ) : (
            <DesktopTableView
              maxSupplies={maxSupplies}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              getDeadlineStatus={getDeadlineStatus}
              getDaysUntilDeadline={getDaysUntilDeadline}
              getProductionTypeIcon={getProductionTypeIcon}
              statusColors={statusColors}
              statusLabels={statusLabels}
              productionColors={productionColors}
              priorityLabels={priorityLabels}
              priorityColors={priorityColors}
              onViewDetail={handleViewDetail}
              onEditClick={handleEditClick}
              onDeleteClick={handleDeleteClick}
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? "small" : "medium"}
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="สร้างงานใหม่"
          onClick={() => navigate("/max-supply/create")}
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            background: "linear-gradient(45deg, #B20000, #E36264)",
            "&:hover": {
              background: "linear-gradient(45deg, #900F0F, #B20000)",
            },
          }}
        >
          <FaPlus />
        </Fab>
      )}

      <DetailDialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        selectedItem={selectedItem}
        getDeadlineStatus={getDeadlineStatus}
        getDaysUntilDeadline={getDaysUntilDeadline}
        getProgressColor={getProgressColor}
        getProductionTypeIcon={getProductionTypeIcon}
        statusColors={statusColors}
        statusLabels={statusLabels}
        productionColors={productionColors}
        priorityLabels={priorityLabels}
        priorityColors={priorityColors}
        onEditClick={handleEditClick}
      />
      
      <DeleteConfirmDialog
        open={deleteConfirmDialog}
        onClose={() => setDeleteConfirmDialog(false)}
        onConfirm={handleDeleteConfirm}
        itemToDelete={itemToDelete}
      />
      
      {/* Edit Form Dialog */}
      <MaxSupplyEditForm
        open={editDialog}
        onClose={handleCloseEdit}
        item={editItem}
        onSave={handleSaveEdit}
        loading={loading}
      />
    </Container>
  );
};

export default MaxSupplyList;
