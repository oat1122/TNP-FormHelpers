// Types สำหรับ CustomerList components

export interface PageSizeSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export interface SortInfoDisplayProps {
  sortModel: Array<{
    field: string;
    sort: 'asc' | 'desc';
  }>;
}

export interface CustomPaginationProps {
  paginationModel: {
    page: number;
    pageSize: number;
  };
  totalItems: number;
  scrollToTop: () => void;
}

export interface CustomToolbarProps {
  serverSortModel: Array<{
    field: string;
    sort: 'asc' | 'desc';
  }>;
  isFetching: boolean;
}

export interface CustomerActionsProps {
  scrollToTop: () => void;
}

export interface ColumnDefinitionsProps {
  handleOpenDialog: (mode: string, id?: string | null) => void;
  handleDelete: (params: any) => void;
  handleRecall: (params: any) => void;
  handleChangeGroup: (isUp: boolean, params: any) => void;
  handleDisableChangeGroupBtn: (isUp: boolean, params: any) => boolean;
  userRole: string;
}

export interface CustomerData {
  cus_id: string;
  cus_no: string;
  cus_channel: number;
  cus_manage_by: {
    user_id: string;
    username: string;
  };
  cus_name: string;
  cus_company?: string;
  cus_tel_1?: string;
  cus_tel_2?: string;
  cd_note?: string;
  business_type?: string;
  cd_last_datetime: string;
  cus_created_date: string;
  cus_email?: string;
  cus_address?: string;
  province_name?: string;
  district_name?: string;
  cus_mcg_id: string;
} 