import React, { useState, useEffect, useCallback } from 'react';
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
    FilterSection,
    PaginationSection,
    LoadingState,
    ErrorState,
    EmptyState,
    Header,
    FloatingActionButton,
} from './components';

// Main Component
const PricingIntegration = () => {
    const dispatch = useDispatch();
    const filters = useSelector(selectFilters);

    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPricingRequest, setSelectedPricingRequest] = useState(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // API Queries
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
        page: currentPage,
        per_page: itemsPerPage,
    });

    // Debug logs
    useEffect(() => {
        console.log('🔍 PricingIntegration Debug Info:', {
            isLoading,
            isFetching,
            error,
            currentPage,
            itemsPerPage,
            pricingRequests,
            apiUrl: `${import.meta.env.VITE_END_POINT_URL}/pricing-requests`,
            responseStructure: pricingRequests ? Object.keys(pricingRequests) : 'No data',
            dataArray: pricingRequests?.data || 'No data array',
            dataLength: pricingRequests?.data?.length || 0,
            pagination: pricingRequests?.pagination || 'No pagination',
            totalPages: pricingRequests?.pagination ? Math.ceil(pricingRequests.pagination.total / itemsPerPage) : 0,
            sampleRecord: pricingRequests?.data?.[0] || 'No records'
        });
    }, [isLoading, isFetching, error, pricingRequests, currentPage, itemsPerPage]);

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

    const handleCreateQuotation = (pricingRequest) => {
        setSelectedPricingRequest(pricingRequest);
        setShowCreateModal(true);
    };

    const handleViewDetails = (pricingRequest) => {
        dispatch(addNotification({
            type: 'info',
            title: 'ดูรายละเอียด',
            message: `กำลังแสดงรายละเอียด ${pricingRequest.pr_number}`,
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

    const handleResetFilters = () => {
        setSearchQuery('');
        setDateRange({ start: null, end: null });
        setSelectedCustomer(null);
        dispatch(resetFilters());
    };

    return (
        <ThemeProvider theme={accountingTheme}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
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

                        {/* Content */}
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}
                            </Alert>
                        )}

                        {/* Pagination Section */}
                        <PaginationSection
                            pagination={pricingRequests?.pagination}
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
                        ) : pricingRequests?.data?.length > 0 ? (
                            <>
                                <Grid container spacing={3}>
                                    {pricingRequests.data.map((request) => (
                                        <Grid item xs={12} sm={6} lg={4} key={request.pr_id}>
                                            <PricingRequestCard
                                                request={request}
                                                onCreateQuotation={handleCreateQuotation}
                                                onViewDetails={handleViewDetails}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>

                                {/* Bottom Pagination */}
                                {pricingRequests?.pagination && pricingRequests.pagination.last_page > 1 && (
                                    <PaginationSection
                                        pagination={pricingRequests.pagination}
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
                        onSubmit={handleSubmitQuotation}
                    />

                    {/* Floating Action Button */}
                    <FloatingActionButton onRefresh={handleRefresh} />
                </Box>
            </LocalizationProvider>
        </ThemeProvider>
    );
};

export default PricingIntegration;
