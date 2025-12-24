import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMediaQuery, useTheme } from "@mui/material";

import { setPaginationModel } from "../../../../features/Customer/customerSlice";

// Required columns ที่ต้องมีใน localStorage preferences
const REQUIRED_COLUMNS = [
  "cus_channel",
  "cd_note",
  "business_type",
  "cus_source",
  "cus_allocation_status",
];

// Default column visibility
const DEFAULT_VISIBILITY = {
  cus_no: false,
  cus_channel: true,
  cus_source: true,
  cus_allocation_status: true,
  cus_manage_by: true,
  cus_name: true,

  cus_tel_1: true,
  cd_note: true,
  business_type: true,
  cd_last_datetime: true,
  cus_created_date: true,
  cus_email: false,
  cus_address: false,
  tools: true,
};

// Default column order
const DEFAULT_ORDER = [
  "cus_channel",
  "cus_source",
  "cus_allocation_status",
  "cus_manage_by",
  "cus_name",
  "cus_tel_1",
  "cd_note",
  "business_type",
  "cd_last_datetime",
  "cus_created_date",
  "tools",
  "cus_no",

  "cus_email",
  "cus_address",
];

/**
 * Hook สำหรับจัดการ Table Configuration (Sort, Visibility, Order, localStorage)
 * @param {Object} user - User object จาก localStorage
 * @param {Function} scrollToTop - Function สำหรับ scroll ไปด้านบน
 * @returns {Object} Table configuration states และ handlers
 */
export const useCustomerTableConfig = (user, scrollToTop) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const paginationModel = useSelector((state) => state.customer.paginationModel);

  // States
  const [serverSortModel, setServerSortModel] = useState([]);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState(DEFAULT_VISIBILITY);
  const [columnOrderModel, setColumnOrderModel] = useState(DEFAULT_ORDER);

  // Media queries for responsive - PC, Notebook, Small screens
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));
  const isExtraSmall = useMediaQuery(theme.breakpoints.down("sm"));
  // New breakpoints for Notebook screens
  const isNotebook = useMediaQuery("(min-width: 1200px) and (max-width: 1440px)");
  const isSmallNotebook = useMediaQuery("(min-width: 1024px) and (max-width: 1200px)");

  // Load column preferences from localStorage on mount with v2 migration
  useEffect(() => {
    try {
      const savedVisibilityV2 = localStorage.getItem("customerTableColumnVisibility_v2");
      const savedOrderV2 = localStorage.getItem("customerTableColumnOrder_v2");

      if (savedVisibilityV2) {
        const parsed = JSON.parse(savedVisibilityV2);
        // ตรวจสอบว่า column ใหม่ที่จำเป็นมีอยู่หรือไม่
        const hasAllRequired = REQUIRED_COLUMNS.every((col) => col in parsed.model);

        if (hasAllRequired) {
          setColumnVisibilityModel(parsed.model);
        } else {
          // ถ้าไม่ครบ ให้ใช้ default
          console.log("Column preferences outdated, using defaults");
        }
      } else {
        // Check for old v1 keys and remove them
        const oldV1Visibility = localStorage.getItem("customerTableColumnVisibility");
        const oldV1Order = localStorage.getItem("customerTableColumnOrder");

        if (oldV1Visibility || oldV1Order) {
          console.log("Migrating from v1 to v2 column preferences");
          localStorage.removeItem("customerTableColumnVisibility");
          localStorage.removeItem("customerTableColumnOrder");
        }
        // Use default state which already includes new columns
      }

      if (savedOrderV2) {
        const parsed = JSON.parse(savedOrderV2);
        const hasAllRequired = REQUIRED_COLUMNS.every((col) => parsed.order.includes(col));

        if (hasAllRequired) {
          setColumnOrderModel(parsed.order);
        } else {
          // ถ้าไม่ครบ ให้ใช้ default
          console.log("Column order outdated, using defaults");
        }
      }
    } catch (error) {
      console.warn("Failed to load column preferences from localStorage", error);
      // ลบ localStorage ที่เสียหาย
      localStorage.removeItem("customerTableColumnVisibility_v2");
      localStorage.removeItem("customerTableColumnOrder_v2");
    }
  }, []); // Empty dependency array - run once on mount

  // Responsive column visibility - ซ่อน column ตามขนาดหน้าจอ
  useEffect(() => {
    const hasSavedPreferences = localStorage.getItem("customerTableColumnVisibility_v2");

    // ถ้าผู้ใช้บันทึก preferences ไว้แล้วให้ใช้ของผู้ใช้
    if (hasSavedPreferences) {
      return;
    }

    // ใช้ default visibility ตาม breakpoint
    const responsiveVisibility = {
      cus_email: false,
      cus_address: false,
    };

    // Small Notebook (1024-1200px) - ซ่อน NOTE, BUSINESS TYPE, CREATED AT
    if (isSmallNotebook) {
      responsiveVisibility.cd_note = false;
      responsiveVisibility.business_type = false;
      responsiveVisibility.cus_created_date = false;
    }
    // Notebook (1200-1440px) - ซ่อน BUSINESS TYPE, CREATED AT
    else if (isNotebook) {
      responsiveVisibility.business_type = false;
      responsiveVisibility.cus_created_date = false;
    }

    // Mobile/Tablet screens
    if (isSmall) {
      responsiveVisibility.cd_note = false;
    }

    if (isExtraSmall) {
      responsiveVisibility.cus_channel = false;
    }

    setColumnVisibilityModel((prev) => ({
      ...prev,
      ...responsiveVisibility,
    }));
  }, [isSmall, isExtraSmall, isNotebook, isSmallNotebook]);

  // Handle sort model change
  const handleSortModelChange = useCallback(
    (newModel) => {
      if (JSON.stringify(newModel) !== JSON.stringify(serverSortModel)) {
        const processedModel = newModel.map((item) => {
          if (item.field === "business_type") {
            return { ...item, field: "cus_bt_id" };
          }
          return item;
        });

        setServerSortModel(processedModel);
        // Reset pagination to first page when sorting
        dispatch(setPaginationModel({ ...paginationModel, page: 0 }));
        scrollToTop();
      }
    },
    [serverSortModel, paginationModel, dispatch, scrollToTop]
  );

  // Handle column visibility change
  const handleColumnVisibilityChange = useCallback(
    (newModel) => {
      setColumnVisibilityModel(newModel);

      try {
        const columnPreferences = {
          model: newModel,
          timestamp: new Date().toISOString(),
          username: user?.username || "unknown",
        };

        localStorage.setItem("customerTableColumnVisibility_v2", JSON.stringify(columnPreferences));
      } catch (error) {
        console.warn("Failed to save column visibility to localStorage", error);
      }
    },
    [user]
  );

  // Handle column order change
  const handleColumnOrderChange = useCallback(
    (newOrder) => {
      setColumnOrderModel(newOrder);

      try {
        const columnOrderPreferences = {
          order: newOrder,
          timestamp: new Date().toISOString(),
          username: user?.username || "unknown",
        };

        localStorage.setItem("customerTableColumnOrder_v2", JSON.stringify(columnOrderPreferences));
      } catch (error) {
        console.warn("Failed to save column order to localStorage", error);
      }
    },
    [user]
  );

  return {
    // Sort
    serverSortModel,
    handleSortModelChange,

    // Visibility
    columnVisibilityModel,
    handleColumnVisibilityChange,

    // Order
    columnOrderModel,
    handleColumnOrderChange,
  };
};
