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
      
      resetFilters: () => set({
        filters: initialState.filters
      }),
      
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
      
      updateFilter: (filter, value) => set((state) => ({
        filters: { ...state.filters, [filter]: value }
      })),
      
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
