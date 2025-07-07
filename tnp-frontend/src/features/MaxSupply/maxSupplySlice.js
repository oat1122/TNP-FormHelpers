import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Initial state
const initialState = {
  // List view state
  itemList: [],
  statusList: [
    { value: 'pending', label: 'รอดำเนินการ', color: 'warning' },
    { value: 'in_progress', label: 'กำลังดำเนินการ', color: 'info' },
    { value: 'completed', label: 'เสร็จสิ้น', color: 'success' },
    { value: 'cancelled', label: 'ยกเลิก', color: 'error' },
  ],
  priorityList: [
    { value: 'low', label: 'ต่ำ', color: 'success' },
    { value: 'medium', label: 'ปานกลาง', color: 'warning' },
    { value: 'high', label: 'สูง', color: 'error' },
    { value: 'urgent', label: 'เร่งด่วน', color: 'error' },
  ],
  
  // Filters
  filters: {
    status: 'all',
    priority: 'all',
    search: '',
    dateRange: {
      startDate: null,
      endDate: null,
    },
    overdue: false,
    startingSoon: false,
    customer: '',
    productType: '',
    quantityRange: {
      min: null,
      max: null,
    },
    printPointsRange: {
      min: null,
      max: null,
    },
  },
  
  // Stats
  stats: {
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    overdue: 0,
    startingSoon: 0,
  },
  
  // Preferences
  preferences: {
    defaultView: 'list',
    itemsPerPage: 15,
    autoRefresh: false,
    showQuickStats: true,
  },
  
  // Pagination
  paginationModel: { 
    pageSize: 15, 
    page: 0 
  },
  totalCount: 0,
  
  // Form state
  formData: {
    worksheet_id: '',
    production_code: '',
    customer_name: '',
    product_name: '',
    quantity: 0,
    print_points: 0,
    start_date: null,
    end_date: null,
    status: 'pending',
    priority: 'medium',
    notes: '',
    additional_data: {},
  },
  
  // UI state
  mode: '', // 'create', 'edit', 'view'
  isLoading: false,
  errors: {},
  
  // Calendar state
  calendarView: 'month',
  calendarDate: new Date(),
  calendarEvents: [],
  
  // File upload state
  uploadedFiles: [],
  isUploading: false,
};

export const useMaxSupplyStore = create(
  devtools(
    (set, get) => ({
      ...initialState,

      // Actions for list management
      setItemList: (itemList) => set({ itemList }),
      
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      })),
      
      updateFilter: (filter, value) => set((state) => ({
        filters: { ...state.filters, [filter]: value }
      })),
      
      resetFilters: () => set({
        filters: initialState.filters
      }),
      
      // Stats management
      setStats: (stats) => set((state) => ({
        stats: { ...state.stats, ...stats }
      })),
      
      updateStats: (data) => {
        const stats = {
          total: data.length,
          pending: data.filter(item => item.status === 'pending').length,
          in_progress: data.filter(item => item.status === 'in_progress').length,
          completed: data.filter(item => item.status === 'completed').length,
          cancelled: data.filter(item => item.status === 'cancelled').length,
          overdue: data.filter(item => {
            const endDate = new Date(item.end_date);
            const now = new Date();
            return endDate < now && item.status !== 'completed';
          }).length,
          startingSoon: data.filter(item => {
            const startDate = new Date(item.start_date);
            const now = new Date();
            const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
            return startDate >= now && startDate <= threeDaysFromNow;
          }).length,
        };
        set({ stats });
      },
      
      // Preferences management
      setPreference: (key, value) => set((state) => ({
        preferences: { ...state.preferences, [key]: value }
      })),
      
      setPreferences: (preferences) => set((state) => ({
        preferences: { ...state.preferences, ...preferences }
      })),
      
      setPaginationModel: (paginationModel) => set({ paginationModel }),
      
      setTotalCount: (totalCount) => set({ totalCount }),

      // Actions for form management
      setFormData: (formData) => set((state) => ({
        formData: { ...state.formData, ...formData }
      })),
      
      resetFormData: () => set({
        formData: initialState.formData
      }),
      
      setMode: (mode) => set({ mode }),
      
      setErrors: (errors) => set({ errors }),
      
      clearErrors: () => set({ errors: {} }),
      
      setIsLoading: (isLoading) => set({ isLoading }),

      // Actions for calendar management
      setCalendarView: (calendarView) => set({ calendarView }),
      
      setCalendarDate: (calendarDate) => set({ calendarDate }),
      
      setCalendarEvents: (calendarEvents) => set({ calendarEvents }),

      // Actions for file management
      setUploadedFiles: (uploadedFiles) => set({ uploadedFiles }),
      
      addUploadedFile: (file) => set((state) => ({
        uploadedFiles: [...state.uploadedFiles, file]
      })),
      
      removeUploadedFile: (fileId) => set((state) => ({
        uploadedFiles: state.uploadedFiles.filter(file => file.id !== fileId)
      })),
      
      setIsUploading: (isUploading) => set({ isUploading }),

      // Helper actions
      updateFormField: (field, value) => set((state) => ({
        formData: { ...state.formData, [field]: value }
      })),
      
      // Apply filters to data
      getFilteredData: (data) => {
        const { filters } = get();
        let filtered = [...data];
        
        // Search filter
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          filtered = filtered.filter(item => 
            item.production_code?.toLowerCase().includes(searchTerm) ||
            item.customer_name?.toLowerCase().includes(searchTerm) ||
            item.product_name?.toLowerCase().includes(searchTerm) ||
            item.notes?.toLowerCase().includes(searchTerm)
          );
        }
        
        // Status filter
        if (filters.status && filters.status !== 'all') {
          filtered = filtered.filter(item => item.status === filters.status);
        }
        
        // Priority filter
        if (filters.priority && filters.priority !== 'all') {
          filtered = filtered.filter(item => item.priority === filters.priority);
        }
        
        // Date range filter
        if (filters.dateRange?.startDate) {
          const startDate = new Date(filters.dateRange.startDate);
          filtered = filtered.filter(item => new Date(item.start_date) >= startDate);
        }
        
        if (filters.dateRange?.endDate) {
          const endDate = new Date(filters.dateRange.endDate);
          filtered = filtered.filter(item => new Date(item.end_date) <= endDate);
        }
        
        // Overdue filter
        if (filters.overdue) {
          const now = new Date();
          filtered = filtered.filter(item => {
            const endDate = new Date(item.end_date);
            return endDate < now && item.status !== 'completed';
          });
        }
        
        // Starting soon filter
        if (filters.startingSoon) {
          const now = new Date();
          const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
          filtered = filtered.filter(item => {
            const startDate = new Date(item.start_date);
            return startDate >= now && startDate <= threeDaysFromNow;
          });
        }
        
        // Customer filter
        if (filters.customer) {
          const customerTerm = filters.customer.toLowerCase();
          filtered = filtered.filter(item => 
            item.customer_name?.toLowerCase().includes(customerTerm)
          );
        }
        
        // Product type filter
        if (filters.productType) {
          const productTypeTerm = filters.productType.toLowerCase();
          filtered = filtered.filter(item => 
            item.product_name?.toLowerCase().includes(productTypeTerm)
          );
        }
        
        // Quantity range filter
        if (filters.quantityRange?.min !== null) {
          filtered = filtered.filter(item => item.quantity >= filters.quantityRange.min);
        }
        
        if (filters.quantityRange?.max !== null) {
          filtered = filtered.filter(item => item.quantity <= filters.quantityRange.max);
        }
        
        // Print points range filter
        if (filters.printPointsRange?.min !== null) {
          filtered = filtered.filter(item => item.print_points >= filters.printPointsRange.min);
        }
        
        if (filters.printPointsRange?.max !== null) {
          filtered = filtered.filter(item => item.print_points <= filters.printPointsRange.max);
        }
        
        return filtered;
      },
      
      // Calculated form fields
      calculatePrintPoints: () => {
        const { quantity, additional_data } = get().formData;
        const basePoints = additional_data?.base_points || 1;
        const complexity = additional_data?.complexity_factor || 1;
        
        const printPoints = (quantity * basePoints * complexity).toFixed(2);
        
        set((state) => ({
          formData: { 
            ...state.formData, 
            print_points: parseFloat(printPoints)
          }
        }));
      },

      // Get status/priority display data
      getStatusDisplay: (status) => {
        const statusList = get().statusList;
        return statusList.find(s => s.value === status) || statusList[0];
      },
      
      getPriorityDisplay: (priority) => {
        const priorityList = get().priorityList;
        return priorityList.find(p => p.value === priority) || priorityList[1];
      },

      // Validation helpers
      validateForm: () => {
        const { formData } = get();
        const errors = {};

        if (!formData.customer_name.trim()) {
          errors.customer_name = 'ชื่อลูกค้าจำเป็น';
        }

        if (!formData.product_name.trim()) {
          errors.product_name = 'ชื่อสินค้าจำเป็น';
        }

        if (!formData.quantity || formData.quantity <= 0) {
          errors.quantity = 'จำนวนต้องมากกว่า 0';
        }

        if (!formData.start_date) {
          errors.start_date = 'วันที่เริ่มต้นจำเป็น';
        }

        if (!formData.end_date) {
          errors.end_date = 'วันที่สิ้นสุดจำเป็น';
        }

        if (formData.start_date && formData.end_date && 
            new Date(formData.start_date) > new Date(formData.end_date)) {
          errors.end_date = 'วันที่สิ้นสุดต้องมากกว่าวันที่เริ่มต้น';
        }

        set({ errors });
        return Object.keys(errors).length === 0;
      },

      // Reset all state
      resetAll: () => set(initialState),
    }),
    {
      name: 'max-supply-store',
    }
  )
);

// Selector helpers for performance optimization
export const useMaxSupplyFormData = () => useMaxSupplyStore(state => state.formData);
export const useMaxSupplyFilters = () => useMaxSupplyStore(state => state.filters);
export const useMaxSupplyPagination = () => useMaxSupplyStore(state => state.paginationModel);
export const useMaxSupplyErrors = () => useMaxSupplyStore(state => state.errors);
export const useMaxSupplyCalendar = () => useMaxSupplyStore(state => ({
  view: state.calendarView,
  date: state.calendarDate,
  events: state.calendarEvents,
}));
