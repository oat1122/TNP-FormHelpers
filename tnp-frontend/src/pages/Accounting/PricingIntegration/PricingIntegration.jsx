import { Box, Container, Grid, Alert } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { th } from "date-fns/locale";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  PricingRequestCard,
  CreateQuotationModal,
  CreateQuotationForm,
  FilterSection,
  PaginationSection,
  LoadingState,
  ErrorState,
  EmptyState,
  Header,
  FloatingActionButton,
} from "./components";
import CustomerEditDialog from "./components/CustomerEditDialog";
import {
  useGetCompletedPricingRequestsQuery,
  useCreateQuotationFromMultiplePricingMutation,
} from "../../../features/Accounting/accountingApi";
import {
  selectFilters,
  setFilters,
  resetFilters,
  addNotification,
} from "../../../features/Accounting/accountingSlice";
import accountingTheme from "../theme/accountingTheme";
// Import performance optimization hooks - commented out temporarily
// import {
//   usePerformanceMonitor,
//   useDebounceSearch,
//   useOptimizedPagination,
//   useOptimizedFilter,
// } from "../hooks/useAccountingOptimization";
// import { PricingRequestListSkeleton } from "../components/SkeletonLoaders";

// Main Component
const PricingIntegration = () => {
  const dispatch = useDispatch();
  const filters = useSelector(selectFilters);

  // Performance monitoring - temporarily disabled
  // const { logCustomMetric } = usePerformanceMonitor("PricingIntegration");

  // Simple search without debouncing for now
  const [searchTerm, setSearchTerm] = useState("");

  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPricingRequest, setSelectedPricingRequest] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPricingRequests, setSelectedPricingRequests] = useState([]);
  // Customer edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  // Local overrides for customer info (to reflect edits without refetch)
  const [customerOverrides, setCustomerOverrides] = useState({}); // key by cus_id

  // Pagination states - use simple pagination for now
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // API Queries - fetch a large page and handle client-side pagination
  const {
    data: pricingRequests,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetCompletedPricingRequestsQuery({
    search: searchTerm, // ใช้ searchTerm ชั่วคราว
    date_start: dateRange.start,
    date_end: dateRange.end,
    customer_id: selectedCustomer?.id,
    page: 1,
    per_page: 1000,
  });

  // Group pricing requests by customer to avoid duplicate customer cards
  // and track quotation status to prevent duplicate quotation creation
  const groupedPricingRequests = useMemo(() => {
    // Performance logging temporarily disabled
    // const startTime = performance.now();

    if (!pricingRequests?.data) return [];
    const map = new Map();

    pricingRequests.data.forEach((req) => {
      // ใช้ข้อมูลลูกค้าจาก pricing_customer หรือ customer (fallback)
      const customerData = req.pricing_customer || req.customer;

      // ใช้ pre-computed customerId จาก API transform
      const customerId =
        req._customerId ||
        (customerData?.cus_id || req.pr_cus_id || req.customer_id || req.cus_id || "").toString();

      if (!customerId) return;

      if (!map.has(customerId)) {
        map.set(customerId, {
          _customerId: customerId,
          customer: {
            ...customerData,
            ...(customerOverrides[customerId] || {}),
          },
          requests: [req],
          // is_quoted will be true only if ALL pricing requests have quotations
          is_quoted: !!req.is_quoted,
          // has_quotation tracks if ANY pricing request has a quotation
          has_quotation: !!req.is_quoted,
          quoted_count: req.is_quoted ? 1 : 0,
          status_counts: req.pr_status ? { [req.pr_status]: 1 } : {},
        });
      } else {
        const existing = map.get(customerId);
        existing.requests.push(req);

        if (req.is_quoted) {
          existing.has_quotation = true;
          existing.quoted_count += 1;
        } else {
          existing.is_quoted = false;
        }

        const status = req.pr_status;
        if (status) {
          existing.status_counts[status] = (existing.status_counts[status] || 0) + 1;
        }
      }
    });

    // attach total counts
    map.forEach((val) => {
      val.total_count = val.requests.length;
    });

    const result = Array.from(map.values());

    // Performance logging temporarily disabled
    // const endTime = performance.now();
    // logCustomMetric("groupedPricingRequests processing", `${(endTime - startTime).toFixed(2)}ms`);

    return result;
  }, [pricingRequests, customerOverrides]);

  // Client-side pagination based on grouped customers
  const totalCustomers = groupedPricingRequests.length;

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return groupedPricingRequests.slice(start, start + itemsPerPage);
  }, [groupedPricingRequests, currentPage, itemsPerPage]);

  const paginationInfo = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const to = Math.min(start + itemsPerPage, totalCustomers);
    return {
      current_page: currentPage,
      last_page: Math.max(1, Math.ceil(totalCustomers / itemsPerPage)),
      per_page: itemsPerPage,
      total: totalCustomers,
      from: totalCustomers === 0 ? 0 : start + 1,
      to,
    };
  }, [currentPage, itemsPerPage, totalCustomers]);

  // Debug logs
  useEffect(() => {}, [
    isLoading,
    isFetching,
    error,
    pricingRequests,
    currentPage,
    itemsPerPage,
    totalCustomers,
    groupedPricingRequests,
  ]);

  const [createQuotationFromMultiplePricing] = useCreateQuotationFromMultiplePricingMutation();

  // Event Handlers
  const handleSearch = useCallback(
    (query) => {
      setSearchTerm(query);
      setCurrentPage(1); // Reset to first page on search
      dispatch(setFilters({ searchQuery: query }));
    },
    [dispatch]
  );

  const handlePageChange = useCallback((event, newPage) => {
    setCurrentPage(newPage);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  }, []);

  const handleRefresh = useCallback(() => {
    // ใช้ refetch() เฉพาะเมื่อผู้ใช้กดปุ่ม Refresh เท่านั้น
    refetch();
    dispatch(
      addNotification({
        type: "success",
        title: "รีเฟรชข้อมูล",
        message: "ข้อมูลถูกอัปเดตแล้ว",
      })
    );
  }, [refetch, dispatch]);

  const handleCreateQuotation = (group) => {
    // เลือก target request เหมือนเดิม (อาจจะใช้แค่ ID หรือข้อมูลเฉพาะของ request)
    const targetRequest = group.requests.find((r) => !r.is_quoted) || group.requests[0];

    // *** สร้าง object ใหม่ที่จะส่งไป Modal ***
    // โดยรวมข้อมูล request ที่เลือก และข้อมูล customer จาก group
    const dataForModal = {
      ...(targetRequest || {}), // ใส่ข้อมูล request ที่เลือก (pr_id, work_name etc.)
      customer: group.customer || {}, // *** ใช้ customer จาก group ที่มีข้อมูลครบ ***
    };

    // ตั้งค่า state ด้วย object ใหม่นี้
    setSelectedPricingRequest(dataForModal);
    setShowCreateModal(true);
  };

  const handleViewDetails = (group) => {
    const target = group.requests[0];
    dispatch(
      addNotification({
        type: "info",
        title: "ดูรายละเอียด",
        message: `กำลังแสดงรายละเอียด ${target.pr_number}`,
      })
    );
    // TODO: Implement view details modal or navigation
  };

  const handleSubmitQuotation = async (data) => {
    try {
      const result = await createQuotationFromMultiplePricing(data).unwrap();

      dispatch(
        addNotification({
          type: "success",
          title: "สร้างใบเสนอราคาสำเร็จ",
          message: `สร้างใบเสนอราคา ${result.quotation_number || "ใหม่"} เรียบร้อยแล้ว`,
        })
      );

      setShowCreateModal(false);
      setSelectedPricingRequest(null);

      // RTK Query จะ invalidate cache อัตโนมัติแล้ว ไม่ต้อง refetch
    } catch (error) {
      dispatch(
        addNotification({
          type: "error",
          title: "เกิดข้อผิดพลาด",
          message: error.data?.message || error.message || "ไม่สามารถสร้างใบเสนอราคาได้",
        })
      );
    }
  };

  const handleQuotationFromModal = async (data) => {
    try {
      setShowCreateModal(false);

      // Filter with better error handling
      const selectedRequests = [];

      if (data.pricingRequestIds && data.pricingRequestIds.length > 0) {
        data.pricingRequestIds.forEach((prId) => {
          const foundRequest = pricingRequests?.data?.find((pr) => pr.pr_id === prId);
          if (foundRequest) {
            selectedRequests.push(foundRequest);
          } else {
            console.error(`❌ Could not find PR with ID: ${prId}`);
          }
        });
      }

      if (selectedRequests.length === 0) {
        console.error("❌ No matching pricing requests found!");
        dispatch(
          addNotification({
            type: "error",
            title: "เกิดข้อผิดพลาด",
            message: "ไม่พบข้อมูลงานที่เลือก กรุณาลองใหม่",
          })
        );
        return;
      }

      // ใช้ข้อมูลสำรองจาก modal หากมี (มี customer แนบมาแล้ว)
      if (data.selectedRequestsData && data.selectedRequestsData.length > 0) {
        setSelectedPricingRequests(data.selectedRequestsData);
      } else {
        // *** ถ้าไม่มี selectedRequestsData ให้แนบ customer จาก modal เข้าไปใน requests ***
        const requestsWithCustomer = selectedRequests.map((req) => ({
          ...req,
          customer: data.customer || req.customer || {},
        }));
        setSelectedPricingRequests(requestsWithCustomer);
      }

      // Add delay to ensure state update
      setTimeout(() => {
        setShowCreateForm(true);
      }, 100);
    } catch (error) {
      console.error("❌ Error preparing quotation form:", error);
      dispatch(
        addNotification({
          type: "error",
          title: "เกิดข้อผิดพลาด",
          message: "เกิดข้อผิดพลาดในการเตรียมข้อมูล กรุณาลองใหม่",
        })
      );
    }
  };

  const handleSaveQuotationDraft = async (data) => {
    try {
      // เตรียมข้อมูลสำหรับส่งไป backend (เหมือนกับ submit แต่เป็น draft)
      // แปลง sizeRows เป็นรายการย่อยใน quotation_items
      const items = (data.items || []).flatMap((item, index) => {
        if (Array.isArray(item.sizeRows) && item.sizeRows.length > 0) {
          return item.sizeRows.map((row, rIndex) => ({
            pricing_request_id: item.isFromPR ? item.pricingRequestId || null : null,
            item_name: item.name,
            pattern: item.pattern || "",
            fabric_type: item.fabricType || "",
            color: item.color || "",
            size: row.size || "",
            unit_price: parseFloat(row.unitPrice) || 0,
            quantity: parseInt(row.quantity, 10) || 0,
            sequence_order: (index + 1) * 100 + (rIndex + 1),
            // use selected unit from form; let backend/db default if empty
            unit: item.unit ?? "",
            notes: row.notes || "",
          }));
        }
        return [
          {
            pricing_request_id: item.isFromPR ? item.pricingRequestId || null : null,
            item_name: item.name,
            pattern: item.pattern || "",
            fabric_type: item.fabricType || "",
            color: item.color || "",
            size: item.size || "",
            unit_price: parseFloat(item.unitPrice) || 0,
            quantity: parseInt(item.quantity, 10) || 0,
            sequence_order: index + 1,
            unit: item.unit ?? "",
            notes: item.notes || "",
          },
        ];
      });

      const submitData = {
        // ข้อมูลหลัก - ต้องตรงกับ validation ใน QuotationController
        pricing_request_ids: selectedPricingRequests.map((pr) => pr.pr_id),
        customer_id: data.customer?.cus_id || selectedPricingRequests[0]?.pr_cus_id,

        // ข้อมูลการคำนวณ
        subtotal: data.subtotal || 0,
        tax_amount: data.vat || 0,
        total_amount: data.total || 0,
        // ⭐ Extended financial fields
        special_discount_percentage:
          data.specialDiscountType === "percentage" ? data.specialDiscountValue || 0 : 0,
        special_discount_amount:
          data.specialDiscountType === "amount"
            ? data.specialDiscountValue || data.specialDiscountAmount || 0
            : data.specialDiscountAmount || 0,
        has_withholding_tax: data.hasWithholdingTax || false,
        withholding_tax_percentage: data.withholdingTaxPercentage || 0,
        withholding_tax_amount: data.withholdingTaxAmount || 0,
        final_total_amount:
          data.finalTotal ||
          data.total - (data.specialDiscountAmount || 0) - (data.withholdingTaxAmount || 0),
        // ⭐ VAT and pricing mode fields
        has_vat: data.hasVat !== undefined ? data.hasVat : true,
        vat_percentage: data.vatPercentage || 7,
        pricing_mode: data.pricingMode || "net",

        // ข้อมูลการชำระเงิน
        deposit_mode: data.depositMode || "percentage",
        deposit_percentage:
          data.depositMode === "percentage"
            ? parseFloat(data.depositPercentage) || 50
            : parseFloat(data.depositPercentage) || 0,
        deposit_amount:
          data.depositMode === "amount"
            ? parseFloat(data.depositAmountInput) || 0
            : data.depositAmount || 0,
        payment_terms: data.paymentMethod || "credit_30",
        due_date: data.due_date ? data.due_date : null,

        // รายการสินค้า
        items,

        // หมายเหตุเพิ่มเติม
        additional_notes: data.notes || "",
        sample_images: Array.isArray(data.sample_images) ? data.sample_images : [],
      };

      // เรียก API mutation (status จะเป็น draft โดยอัตโนมัติใน service)
      const result = await createQuotationFromMultiplePricing(submitData).unwrap();

      // แสดงข้อความสำเร็จ
      dispatch(
        addNotification({
          type: "success",
          title: "บันทึกร่างสำเร็จ! 📝",
          message: `เลขที่ใบเสนอราคา: ${result.data?.number || "N/A"} (สถานะ: ร่าง)`,
        })
      );

      // รีเซ็ตฟอร์มและกลับไปหน้าหลัก
      setShowCreateForm(false);
      setSelectedPricingRequests([]);
      // RTK Query จะ invalidate cache อัตโนมัติแล้ว ไม่ต้อง refetch
    } catch (error) {
      console.error("❌ Error saving draft:", error);

      dispatch(
        addNotification({
          type: "error",
          title: "เกิดข้อผิดพลาดในการบันทึกร่าง",
          message: error?.data?.message || error?.message || "ไม่สามารถบันทึกร่างได้",
        })
      );
    }
  };

  const handleSubmitQuotationForm = async (data) => {
    try {
      // เตรียมข้อมูลสำหรับส่งไป backend
      const items = (data.items || []).flatMap((item, index) => {
        if (Array.isArray(item.sizeRows) && item.sizeRows.length > 0) {
          return item.sizeRows.map((row, rIndex) => ({
            pricing_request_id: item.isFromPR ? item.pricingRequestId || null : null,
            item_name: item.name,
            pattern: item.pattern || "",
            fabric_type: item.fabricType || "",
            color: item.color || "",
            size: row.size || "",
            unit_price: parseFloat(row.unitPrice) || 0,
            quantity: parseInt(row.quantity, 10) || 0,
            sequence_order: (index + 1) * 100 + (rIndex + 1),
            unit: item.unit ?? "",
            notes: row.notes || "",
          }));
        }
        return [
          {
            pricing_request_id: item.isFromPR ? item.pricingRequestId || null : null,
            item_name: item.name,
            pattern: item.pattern || "",
            fabric_type: item.fabricType || "",
            color: item.color || "",
            size: item.size || "",
            unit_price: item.unitPrice || 0,
            quantity: item.quantity || 0,
            sequence_order: index + 1,
            unit: item.unit ?? "",
            notes: item.notes || "",
          },
        ];
      });

      const submitData = {
        // ข้อมูลหลัก - ต้องตรงกับ validation ใน QuotationController
        pricing_request_ids: selectedPricingRequests.map((pr) => pr.pr_id),
        customer_id: data.customer?.cus_id || selectedPricingRequests[0]?.pr_cus_id,

        // ข้อมูลการคำนวณ
        subtotal: data.subtotal || 0,
        tax_amount: data.vat || 0,
        total_amount: data.total || 0,
        // Extended financial fields
        special_discount_percentage:
          data.specialDiscountType === "percentage" ? data.specialDiscountValue || 0 : 0,
        special_discount_amount:
          data.specialDiscountType === "amount"
            ? data.specialDiscountValue || data.specialDiscountAmount || 0
            : data.specialDiscountAmount || 0,
        has_withholding_tax: data.hasWithholdingTax || false,
        withholding_tax_percentage: data.withholdingTaxPercentage || 0,
        withholding_tax_amount: data.withholdingTaxAmount || 0,
        final_total_amount:
          data.finalTotal ||
          data.total - (data.specialDiscountAmount || 0) - (data.withholdingTaxAmount || 0),
        //  VAT and pricing mode fields
        has_vat: data.hasVat !== undefined ? data.hasVat : true,
        vat_percentage: data.vatPercentage || 7,
        pricing_mode: data.pricingMode || "net",

        // ข้อมูลการชำระเงิน
        deposit_mode: data.depositMode || "percentage",
        deposit_percentage:
          data.depositMode === "percentage"
            ? parseFloat(data.depositPercentage) || 50
            : parseFloat(data.depositPercentage) || 0,
        deposit_amount:
          data.depositMode === "amount"
            ? parseFloat(data.depositAmountInput) || 0
            : data.depositAmount || 0,
        payment_terms: data.paymentMethod || "credit_30",
        due_date: data.due_date ? data.due_date : null,

        // รายการสินค้า
        items,

        // หมายเหตุเพิ่มเติม
        additional_notes: data.notes || "",
        sample_images: Array.isArray(data.sample_images) ? data.sample_images : [],
      };

      // เรียก API mutation
      const result = await createQuotationFromMultiplePricing(submitData).unwrap();

      // แสดงข้อความสำเร็จ
      dispatch(
        addNotification({
          type: "success",
          title: "สร้างใบเสนอราคาสำเร็จ! 🎉",
          message: `เลขที่ใบเสนอราคา: ${result.data?.number || "N/A"} ยอดรวม: ${new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(result.data?.total_amount || 0)}`,
        })
      );

      // รีเซ็ตฟอร์มและกลับไปหน้าหลัก
      setShowCreateForm(false);
      setSelectedPricingRequests([]);
      // RTK Query จะ invalidate cache อัตโนมัติแล้ว ไม่ต้อง refetch
    } catch (error) {
      console.error("❌ Error submitting quotation:", error);

      // แสดงข้อความผิดพลาด
      dispatch(
        addNotification({
          type: "error",
          title: "เกิดข้อผิดพลาดในการสร้างใบเสนอราคา",
          message:
            error?.data?.message ||
            error?.message ||
            "ไม่สามารถสร้างใบเสนอราคาได้ กรุณาลองใหม่อีกครั้ง",
        })
      );
    }
  };

  // Edit customer handlers
  const handleEditCustomer = useCallback((group) => {
    const cust = group.customer || {};
    setEditingCustomer(cust);
    setEditDialogOpen(true);
  }, []);

  const handleCustomerUpdated = useCallback((updated) => {
    if (!updated?.cus_id) return;
    setCustomerOverrides((prev) => ({
      ...prev,
      [String(updated.cus_id)]: updated,
    }));
  }, []);

  const handleResetFilters = () => {
    setSearchTerm("");
    setDateRange({ start: null, end: null });
    setSelectedCustomer(null);
    dispatch(resetFilters());
  };

  return (
    <ThemeProvider theme={accountingTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
        {/* Show Create Quotation Form */}
        {showCreateForm ? (
          <CreateQuotationForm
            selectedPricingRequests={selectedPricingRequests}
            onBack={() => {
              setShowCreateForm(false);
              setSelectedPricingRequests([]);
            }}
            onSave={handleSaveQuotationDraft}
            onSubmit={handleSubmitQuotationForm}
          />
        ) : (
          <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
            {/* Header */}
            <Header />

            <Container maxWidth="xl" sx={{ py: 4 }}>
              {/* Filters Section */}
              <FilterSection
                searchQuery={searchTerm}
                onSearchChange={handleSearch}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                onRefresh={handleRefresh}
                onResetFilters={handleResetFilters}
              />

              {/* Content */}
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}
                </Alert>
              )}

              {/* Pagination Section */}
              <PaginationSection
                pagination={paginationInfo}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                isFetching={isFetching}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />

              {/* Main Content */}
              {isLoading ? (
                <LoadingState itemCount={6} />
              ) : error ? (
                <ErrorState error={error} onRetry={handleRefresh} />
              ) : groupedPricingRequests.length > 0 ? (
                <>
                  <Grid container spacing={3}>
                    {paginatedRequests.map((group) => (
                      <Grid item xs={12} sm={6} lg={4} key={group._customerId}>
                        <PricingRequestCard
                          group={group}
                          onCreateQuotation={handleCreateQuotation}
                          onEditCustomer={handleEditCustomer}
                        />
                      </Grid>
                    ))}
                  </Grid>

                  {/* Bottom Pagination */}
                  {paginationInfo.last_page > 1 && (
                    <PaginationSection
                      pagination={paginationInfo}
                      currentPage={currentPage}
                      itemsPerPage={itemsPerPage}
                      isFetching={isFetching}
                      onPageChange={handlePageChange}
                      onItemsPerPageChange={handleItemsPerPageChange}
                      showHeader={false}
                    />
                  )}
                </>
              ) : (
                <EmptyState onRefresh={handleRefresh} />
              )}
            </Container>

            {/* Create Quotation Modal */}
            <CreateQuotationModal
              open={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              pricingRequest={selectedPricingRequest}
              onSubmit={handleQuotationFromModal}
            />

            {/* Customer Edit Dialog */}
            <CustomerEditDialog
              open={editDialogOpen}
              onClose={() => setEditDialogOpen(false)}
              customer={editingCustomer}
              onUpdated={handleCustomerUpdated}
            />

            {/* Floating Action Button */}
            <FloatingActionButton onRefresh={handleRefresh} />
          </Box>
        )}
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default PricingIntegration;
