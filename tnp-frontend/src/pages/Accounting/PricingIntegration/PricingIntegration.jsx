import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Container,
    Grid,
    Alert,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { th } from 'date-fns/locale';
import accountingTheme from '../theme/accountingTheme';
import { useSelector, useDispatch } from 'react-redux';
import {
    selectFilters,
    setFilters,
    resetFilters,
    addNotification,
} from '../../../features/Accounting/accountingSlice';
import {
    useGetCompletedPricingRequestsQuery,
    useCreateQuotationFromMultiplePricingMutation,
} from '../../../features/Accounting/accountingApi';
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
} from './components';
import CustomerEditDialog from './components/CustomerEditDialog';

// Main Component
const PricingIntegration = () => {
    const dispatch = useDispatch();
    const filters = useSelector(selectFilters);

    const [searchQuery, setSearchQuery] = useState('');
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

    // Pagination states
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
        search: searchQuery,
        date_start: dateRange.start,
        date_end: dateRange.end,
        customer_id: selectedCustomer?.id,
        page: 1,
        per_page: 1000,
    });

    // Group pricing requests by customer to avoid duplicate customer cards
    // and track quotation status to prevent duplicate quotation creation
    const groupedPricingRequests = useMemo(() => {
        if (!pricingRequests?.data) return [];
        const map = new Map();

        pricingRequests.data.forEach((req) => {
            const customerId = (
                req.customer?.cus_id ||
                req.pr_cus_id ||
                req.customer_id ||
                req.cus_id || ''
            ).toString();
            if (!customerId) return;

            if (!map.has(customerId)) {
                map.set(customerId, {
                    _customerId: customerId,
                    customer: {
                        ...req.customer,
                        ...(customerOverrides[customerId] || {}),
                    },
                    requests: [req],
                    // is_quoted will be true only if ALL pricing requests have quotations
                    is_quoted: !!req.is_quoted,
                    // has_quotation tracks if ANY pricing request has a quotation
                    has_quotation: !!req.is_quoted,
                    quoted_count: req.is_quoted ? 1 : 0,
                    status_counts: req.pr_status
                        ? { [req.pr_status]: 1 }
                        : {},
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
                    existing.status_counts[status] =
                        (existing.status_counts[status] || 0) + 1;
                }
            }
        });

        // attach total counts
        map.forEach((val) => {
            val.total_count = val.requests.length;
        });

        return Array.from(map.values());
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
    useEffect(() => {
        console.log('🔍 PricingIntegration Debug Info:', {
            isLoading,
            isFetching,
            error,
            currentPage,
            itemsPerPage,
            totalCustomers,
            apiUrl: `${import.meta.env.VITE_END_POINT_URL}/pricing-requests`,
            responseStructure: pricingRequests ? Object.keys(pricingRequests) : 'No data',
            dataArray: pricingRequests?.data || 'No data array',
            dataLength: pricingRequests?.data?.length || 0,
            sampleRecord: pricingRequests?.data?.[0] || 'No records'
        });
    }, [isLoading, isFetching, error, pricingRequests, currentPage, itemsPerPage, totalCustomers]);

    const [createQuotationFromMultiplePricing] = useCreateQuotationFromMultiplePricingMutation();

    // Event Handlers
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        setCurrentPage(1); // Reset to first page on search
        dispatch(setFilters({ searchQuery: query }));
    }, [dispatch]);

    const handlePageChange = useCallback((event, newPage) => {
        setCurrentPage(newPage);
        // Scroll to top when changing pages
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page
    }, []);

    const handleRefresh = useCallback(() => {
        refetch();
        dispatch(addNotification({
            type: 'success',
            title: 'รีเฟรชข้อมูล',
            message: 'ข้อมูลถูกอัปเดตแล้ว',
        }));
    }, [refetch, dispatch]);

    const handleCreateQuotation = (group) => {
        const target = group.requests.find((r) => !r.is_quoted) || group.requests[0];
        setSelectedPricingRequest(target);
        setShowCreateModal(true);
    };

    const handleViewDetails = (group) => {
        const target = group.requests[0];
        dispatch(addNotification({
            type: 'info',
            title: 'ดูรายละเอียด',
            message: `กำลังแสดงรายละเอียด ${target.pr_number}`,
        }));
        // TODO: Implement view details modal or navigation
    };

    const handleSubmitQuotation = async (data) => {
        try {
            const result = await createQuotationFromMultiplePricing(data).unwrap();

            dispatch(addNotification({
                type: 'success',
                title: 'สร้างใบเสนอราคาสำเร็จ',
                message: `สร้างใบเสนอราคา ${result.quotation_number || 'ใหม่'} เรียบร้อยแล้ว`,
            }));

            setShowCreateModal(false);
            setSelectedPricingRequest(null);

            // Refresh data
            refetch();
        } catch (error) {
            dispatch(addNotification({
                type: 'error',
                title: 'เกิดข้อผิดพลาด',
                message: error.data?.message || error.message || 'ไม่สามารถสร้างใบเสนอราคาได้',
            }));
        }
    };

    const handleQuotationFromModal = async (data) => {
        try {
            console.log('🔍 Debug - Data from Modal:', data);
            console.log('📋 Selected Pricing IDs:', data.pricingRequestIds);
            console.log('🗂️ All Pricing Requests Data:', pricingRequests?.data);

            setShowCreateModal(false);
            
            // Filter with better error handling
            const selectedRequests = [];
            
            if (data.pricingRequestIds && data.pricingRequestIds.length > 0) {
                data.pricingRequestIds.forEach(prId => {
                    const foundRequest = pricingRequests?.data?.find(pr => pr.pr_id === prId);
                    if (foundRequest) {
                        selectedRequests.push(foundRequest);
                        console.log(`✅ Found PR ${prId}:`, foundRequest.pr_work_name);
                    } else {
                        console.error(`❌ Could not find PR with ID: ${prId}`);
                    }
                });
            }

            console.log('📊 Final Count - Expected:', data.pricingRequestIds?.length, 'Actual:', selectedRequests.length);

            if (selectedRequests.length === 0) {
                console.error('❌ No matching pricing requests found!');
                dispatch(addNotification({
                    type: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    message: 'ไม่พบข้อมูลงานที่เลือก กรุณาลองใหม่',
                }));
                return;
            }

            // ใช้ข้อมูลสำรองจาก modal หากมี
            if (data.selectedRequestsData && data.selectedRequestsData.length > 0) {
                console.log('🔄 Using backup data from modal:', data.selectedRequestsData);
                setSelectedPricingRequests(data.selectedRequestsData);
            } else {
                setSelectedPricingRequests(selectedRequests);
            }
            
            // Add delay to ensure state update
            setTimeout(() => {
                setShowCreateForm(true);
            }, 100);

        } catch (error) {
            console.error('❌ Error preparing quotation form:', error);
            dispatch(addNotification({
                type: 'error',
                title: 'เกิดข้อผิดพลาด',
                message: 'เกิดข้อผิดพลาดในการเตรียมข้อมูล กรุณาลองใหม่',
            }));
        }
    };

    const handleSaveQuotationDraft = async (data) => {
        try {
            console.log('💾 Saving quotation draft with data:', data);

            // เตรียมข้อมูลสำหรับส่งไป backend (เหมือนกับ submit แต่เป็น draft)
            // แปลง sizeRows เป็นรายการย่อยใน quotation_items
            const items = (data.items || []).flatMap((item, index) => {
                if (Array.isArray(item.sizeRows) && item.sizeRows.length > 0) {
                    return item.sizeRows.map((row, rIndex) => ({
                        pricing_request_id: item.pricingRequestId || item.id,
                        item_name: item.name,
                        pattern: item.pattern || '',
                        fabric_type: item.fabricType || '',
                        color: item.color || '',
                        size: row.size || '',
                        unit_price: parseFloat(row.unitPrice) || 0,
                        quantity: parseInt(row.quantity, 10) || 0,
                        sequence_order: (index + 1) * 100 + (rIndex + 1),
                        // use selected unit from form; let backend/db default if empty
                        unit: (item.unit ?? ''),
                        notes: item.notes || ''
                    }));
                }
                return [{
                    pricing_request_id: item.pricingRequestId || item.id,
                    item_name: item.name,
                    pattern: item.pattern || '',
                    fabric_type: item.fabricType || '',
                    color: item.color || '',
                    size: item.size || '',
                    unit_price: parseFloat(item.unitPrice) || 0,
                    quantity: parseInt(item.quantity, 10) || 0,
                    sequence_order: index + 1,
                    unit: (item.unit ?? ''),
                    notes: item.notes || ''
                }];
            });

            const submitData = {
                // ข้อมูลหลัก - ต้องตรงกับ validation ใน QuotationController
                pricing_request_ids: selectedPricingRequests.map(pr => pr.pr_id),
                customer_id: data.customer?.cus_id || selectedPricingRequests[0]?.pr_cus_id,

                // ข้อมูลการคำนวณ
                subtotal: data.subtotal || 0,
                tax_amount: data.vat || 0,
                total_amount: data.total || 0,

                // ข้อมูลการชำระเงิน
                deposit_percentage: data.depositPercentage === 'custom'
                    ? parseInt(data.customDepositPercentage) || 50
                    : parseInt(data.depositPercentage) || 50,
                payment_terms: data.paymentMethod || 'credit_30',

                // รายการสินค้า
                items,

                // หมายเหตุเพิ่มเติม
                additional_notes: data.notes || '',
            };

            console.log('📤 API Draft Data:', submitData);

            // เรียก API mutation (status จะเป็น draft โดยอัตโนมัติใน service)
            const result = await createQuotationFromMultiplePricing(submitData).unwrap();
            
            console.log('✅ Draft saved successfully:', result);

            // แสดงข้อความสำเร็จ
            dispatch(addNotification({
                type: 'success',
                title: 'บันทึกร่างสำเร็จ! 📝',
                message: `เลขที่ใบเสนอราคา: ${result.data?.number || 'N/A'} (สถานะ: ร่าง)`,
            }));
            
            // รีเซ็ตฟอร์มและกลับไปหน้าหลัก
            setShowCreateForm(false);
            setSelectedPricingRequests([]);
            refetch(); // รีเฟรชข้อมูล pricing requests
            
        } catch (error) {
            console.error('❌ Error saving draft:', error);
            
            dispatch(addNotification({
                type: 'error',
                title: 'เกิดข้อผิดพลาดในการบันทึกร่าง',
                message: error?.data?.message || error?.message || 'ไม่สามารถบันทึกร่างได้',
            }));
        }
    };

    const handleSubmitQuotationForm = async (data) => {
        try {
            console.log('🚀 Submitting quotation form with data:', data);

            // เตรียมข้อมูลสำหรับส่งไป backend
            const items = (data.items || []).flatMap((item, index) => {
                if (Array.isArray(item.sizeRows) && item.sizeRows.length > 0) {
                    return item.sizeRows.map((row, rIndex) => ({
                        pricing_request_id: item.pricingRequestId || item.id,
                        item_name: item.name,
                        pattern: item.pattern || '',
                        fabric_type: item.fabricType || '',
                        color: item.color || '',
                        size: row.size || '',
                        unit_price: parseFloat(row.unitPrice) || 0,
                        quantity: parseInt(row.quantity, 10) || 0,
                        sequence_order: (index + 1) * 100 + (rIndex + 1),
                        unit: (item.unit ?? ''),
                        notes: item.notes || ''
                    }));
                }
                return [{
                    pricing_request_id: item.pricingRequestId || item.id,
                    item_name: item.name,
                    pattern: item.pattern || '',
                    fabric_type: item.fabricType || '',
                    color: item.color || '',
                    size: item.size || '',
                    unit_price: item.unitPrice || 0,
                    quantity: item.quantity || 0,
                    sequence_order: index + 1,
                    unit: (item.unit ?? ''),
                    notes: item.notes || ''
                }];
            });

            const submitData = {
                // ข้อมูลหลัก - ต้องตรงกับ validation ใน QuotationController
                pricing_request_ids: selectedPricingRequests.map(pr => pr.pr_id),
                customer_id: data.customer?.cus_id || selectedPricingRequests[0]?.pr_cus_id,

                // ข้อมูลการคำนวณ
                subtotal: data.subtotal || 0,
                tax_amount: data.vat || 0,
                total_amount: data.total || 0,

                // ข้อมูลการชำระเงิน
                deposit_percentage: data.depositPercentage === 'custom'
                    ? parseInt(data.customDepositPercentage) || 50
                    : parseInt(data.depositPercentage) || 50,
                payment_terms: data.paymentMethod || 'credit_30',

                // รายการสินค้า
                items,

                // หมายเหตุเพิ่มเติม
                additional_notes: data.notes || '',
            };

            console.log('📤 API Submit Data:', submitData);

            // เรียก API mutation
            const result = await createQuotationFromMultiplePricing(submitData).unwrap();
            
            console.log('✅ Quotation created successfully:', result);

            // แสดงข้อความสำเร็จ
            dispatch(addNotification({
                type: 'success',
                title: 'สร้างใบเสนอราคาสำเร็จ! 🎉',
                message: `เลขที่ใบเสนอราคา: ${result.data?.number || 'N/A'} ยอดรวม: ${new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(result.data?.total_amount || 0)}`,
            }));
            
            // รีเซ็ตฟอร์มและกลับไปหน้าหลัก
            setShowCreateForm(false);
            setSelectedPricingRequests([]);
            refetch(); // รีเฟรชข้อมูล pricing requests
            
        } catch (error) {
            console.error('❌ Error submitting quotation:', error);
            
            // แสดงข้อความผิดพลาด
            dispatch(addNotification({
                type: 'error',
                title: 'เกิดข้อผิดพลาดในการสร้างใบเสนอราคา',
                message: error?.data?.message || error?.message || 'ไม่สามารถสร้างใบเสนอราคาได้ กรุณาลองใหม่อีกครั้ง',
            }));
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
        setSearchQuery('');
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
                    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
                        {/* Header */}
                        <Header />

                        <Container maxWidth="xl" sx={{ py: 4 }}>
                            {/* Filters Section */}
                            <FilterSection
                                searchQuery={searchQuery}
                                onSearchChange={handleSearch}
                                dateRange={dateRange}
                                onDateRangeChange={setDateRange}
                                onRefresh={handleRefresh}
                                onResetFilters={handleResetFilters}
                            />

                            {/* 🔐 Access Control Information */}
                            {(() => {
                                const userData = JSON.parse(localStorage.getItem("userData") || "{}");
                                const isAdmin = userData.user_id === 1;
                                
                                if (!isAdmin) {
                                    return (
                                        <Alert 
                                            severity="info" 
                                            sx={{ mb: 3, borderRadius: 2 }}
                                            icon={<span>🔐</span>}
                                        >
                                            <strong>การแบ่งสิทธิ์การเข้าถึง:</strong> คุณสามารถดูข้อมูล Pricing Request ได้เฉพาะลูกค้าที่คุณดูแลเท่านั้น
                                            {userData.username && (
                                                <Box component="span" sx={{ ml: 1, color: 'info.dark', fontWeight: 'medium' }}>
                                                    (ผู้ใช้: {userData.username})
                                                </Box>
                                            )}
                                        </Alert>
                                    );
                                }
                                return null;
                            })()}

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
