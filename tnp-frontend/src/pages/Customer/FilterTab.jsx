import React, { useState, useContext, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  ToggleButton,
  CircularProgress,
  Box,
  Select,
  MenuItem,
  FormControl,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  setGroupSelected,
  setPaginationModel,
  fetchFilteredCustomers,
} from "../../features/Customer/customerSlice";
import ScrollContext from "./ScrollContext";
import { apiConfig } from "../../api/apiConfig";

function FilterTab() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const groupList = useSelector((state) => state.customer.groupList);
  const totalCount = useSelector((state) => state.customer.totalCount);
  const groupSelected = useSelector((state) => state.customer.groupSelected);
  const itemList = useSelector((state) => state.customer.itemList);
  const filters = useSelector((state) => state.customer.filters);
  const { scrollToTop } = useContext(ScrollContext);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [allGroupCounts, setAllGroupCounts] = useState({});

  // เช็คว่ามีการกรองข้อมูลอยู่หรือไม่
  const hasActiveFilters =
    filters.dateRange.startDate ||
    filters.dateRange.endDate ||
    (filters.salesName && filters.salesName.length > 0) ||
    (filters.channel && filters.channel.length > 0);

  // ดึงตัวเลขจำนวนข้อมูลของทุกกลุ่มตามการกรองปัจจุบัน
  useEffect(() => {
    const fetchAllGroupCounts = async () => {
      // ถ้าไม่มีการกรอง ไม่จำเป็นต้องดึงข้อมูลพิเศษ
      if (!hasActiveFilters) {
        setAllGroupCounts({});
        return;
      }

      try {
        setIsLoadingCounts(true);

        // สร้างพารามิเตอร์สำหรับการกรอง (เหมือนกับที่ใช้ใน fetchFilteredCustomers)
        const userData = JSON.parse(localStorage.getItem("userData"));
        const params = new URLSearchParams();

        // Add user ID
        params.append("user", userData?.user_id);

        // Add filter parameters
        if (filters.dateRange.startDate) {
          params.append("start_date", filters.dateRange.startDate);
        }
        if (filters.dateRange.endDate) {
          params.append("end_date", filters.dateRange.endDate);
        }
        if (Array.isArray(filters.salesName) && filters.salesName.length > 0) {
          params.append("sales_names", filters.salesName.join(","));
        }
        if (Array.isArray(filters.channel) && filters.channel.length > 0) {
          params.append("channels", filters.channel.join(","));
        }

        // Parameter to request all group counts without limiting by group
        params.append("counts_only", "true");

        const response = await fetch(
          `${apiConfig.baseUrl}/customerGroupCounts?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch group counts");

        const data = await response.json();
        setAllGroupCounts(data.group_counts || {});
      } catch (error) {
        console.error("Error fetching group counts:", error);
      } finally {
        setIsLoadingCounts(false);
      }
    };

    // ดึงข้อมูลจำนวนในแต่ละกลุ่มเมื่อการกรองเปลี่ยน
    fetchAllGroupCounts();
  }, [filters, hasActiveFilters]);

  const handleSelectGroup = (event, newVal) => {
    // Handle both ToggleButton and Select events
    const value = newVal || event.target.value;

    if (value !== null && value !== undefined) {
      console.log(`เปลี่ยนกลุ่มเป็น: ${value}, คงตัวกรองเดิมไว้:`, filters);

      // Update the selected group
      dispatch(setGroupSelected(value));

      // Reset pagination to first page
      dispatch(setPaginationModel({ page: 0, pageSize: 30 }));

      // เรียกข้อมูลใหม่โดยใช้ตัวกรองปัจจุบัน (ไม่รีเซ็ตตัวกรองอีกต่อไป)
      dispatch(
        fetchFilteredCustomers({
          dateRange: filters.dateRange,
          salesName: filters.salesName,
          channel: filters.channel,
        })
      );

      // Scroll to top when changing groups
      scrollToTop();
    }
  };

  // Sort groups by mcg_sort to ensure they're shown in the right order: A, B, C, D
  const sortedGroupList = [...groupList].sort((a, b) => a.mcg_sort - b.mcg_sort);

  // Mobile Dropdown Component
  const MobileDropdown = () => (
    <Box sx={{ width: "100%" }}>
      <FormControl
        fullWidth
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            backgroundColor: "#fffaf9",
            border: "1px solid rgba(158, 0, 0, 0.3)",
            fontFamily: "Kanit",
            fontSize: "0.875rem",
            "&:hover": {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#9e0000",
              },
            },
            "&.Mui-focused": {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#9e0000",
                borderWidth: "2px",
              },
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(158, 0, 0, 0.3)",
            },
          },
          "& .MuiSelect-select": {
            color: "#9e0000",
            fontWeight: 500,
            padding: "10px 14px",
          },
          "& .MuiSelect-icon": {
            color: "#9e0000",
          },
        }}
      >
        <Select
          value={groupSelected}
          onChange={handleSelectGroup}
          displayEmpty
          renderValue={(selected) => {
            if (selected === "all") {
              const totalCount = hasActiveFilters
                ? Object.values(allGroupCounts).reduce((sum, count) => sum + count, 0) || 0
                : groupList.reduce((sum, item) => sum + (item.customer_group_count || 0), 0);
              return `ทั้งหมด (${totalCount})`;
            }

            const selectedGroup = sortedGroupList.find((item) => item.mcg_id === selected);
            if (selectedGroup) {
              const count = hasActiveFilters
                ? allGroupCounts[selectedGroup.mcg_id] || 0
                : selectedGroup.customer_group_count || 0;
              return `${selectedGroup.mcg_name} (${count})`;
            }

            return "เลือกกลุ่มลูกค้า";
          }}
        >
          <MenuItem
            value="all"
            sx={{
              fontFamily: "Kanit",
              fontSize: "0.875rem",
              color: "#9e0000",
              "&:hover": {
                backgroundColor: "rgba(158, 0, 0, 0.08)",
              },
              "&.Mui-selected": {
                backgroundColor: "rgba(158, 0, 0, 0.12)",
                "&:hover": {
                  backgroundColor: "rgba(158, 0, 0, 0.16)",
                },
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                width: "100%",
                justifyContent: "space-between",
              }}
            >
              <span>ทั้งหมด</span>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <span>
                  (
                  {hasActiveFilters
                    ? Object.values(allGroupCounts).reduce((sum, count) => sum + count, 0) ||
                      totalCount
                    : totalCount}
                  )
                </span>
                {isLoadingCounts && <CircularProgress size={12} sx={{ color: "#9e0000" }} />}
              </Box>
            </Box>
          </MenuItem>

          {sortedGroupList.map((item, index) => (
            <MenuItem
              key={index}
              value={item.mcg_id}
              sx={{
                fontFamily: "Kanit",
                fontSize: "0.875rem",
                color: "#9e0000",
                "&:hover": {
                  backgroundColor: "rgba(158, 0, 0, 0.08)",
                },
                "&.Mui-selected": {
                  backgroundColor: "rgba(158, 0, 0, 0.12)",
                  "&:hover": {
                    backgroundColor: "rgba(158, 0, 0, 0.16)",
                  },
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  width: "100%",
                  justifyContent: "space-between",
                }}
              >
                <span>{item.mcg_name}</span>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <span>
                    (
                    {hasActiveFilters
                      ? allGroupCounts[item.mcg_id] || 0
                      : item.customer_group_count || 0}
                    )
                  </span>
                  {isLoadingCounts && <CircularProgress size={12} sx={{ color: "#9e0000" }} />}
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );

  // Desktop Toggle Buttons Component
  const DesktopToggleButtons = () => (
    <Box
      sx={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, auto))",
        gap: 1,
      }}
    >
      <ToggleButton
        value="all"
        selected={groupSelected === "all"}
        onChange={(e) => handleSelectGroup(e, "all")}
        sx={{
          fontSize: "0.875rem",
          fontFamily: "Kanit",
          textAlign: "center",
          padding: "6px 10px",
          borderRadius: "6px",
          border: "1px solid rgba(211, 47, 47, 0.3)",
          backgroundColor: groupSelected === "all" ? "#8B0000" : "transparent",
          color: groupSelected === "all" ? "#fff" : "rgba(211, 47, 47, 0.8)",
          fontWeight: groupSelected === "all" ? 600 : 400,
          minHeight: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          "&.MuiToggleButton-root": {
            backgroundColor:
              groupSelected === "all" ? "#8B0000 !important" : "transparent !important",
            color:
              groupSelected === "all" ? "#fff !important" : "rgba(211, 47, 47, 0.8) !important",
            border: "1px solid rgba(211, 47, 47, 0.3) !important",
          },
          "&:hover": {
            backgroundColor: groupSelected === "all" ? "#8B0000 !important" : "#a91c1c !important",
            color: "#fff !important",
          },
          "&.Mui-selected": {
            backgroundColor: "#8B0000 !important",
            color: "#fff !important",
            "&:hover": {
              backgroundColor: "#8B0000 !important",
              color: "#fff !important",
            },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            fontSize: "inherit",
          }}
        >
          <span>
            ทั้งหมด (
            {hasActiveFilters
              ? Object.values(allGroupCounts).reduce((sum, count) => sum + count, 0) || totalCount
              : totalCount}
            )
          </span>
          {isLoadingCounts && <CircularProgress size={10} color="inherit" />}
        </Box>
      </ToggleButton>

      {sortedGroupList.map((item, index) => (
        <ToggleButton
          key={index}
          value={item.mcg_id}
          selected={groupSelected === item.mcg_id}
          onChange={(e) => handleSelectGroup(e, item.mcg_id)}
          sx={{
            fontSize: "0.875rem",
            fontFamily: "Kanit",
            textAlign: "center",
            padding: "6px 10px",
            borderRadius: "6px",
            border: "1px solid rgba(211, 47, 47, 0.3)",
            backgroundColor: groupSelected === item.mcg_id ? "#8B0000" : "transparent",
            color: groupSelected === item.mcg_id ? "#fff" : "rgba(211, 47, 47, 0.8)",
            fontWeight: groupSelected === item.mcg_id ? 600 : 400,
            minHeight: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "&.MuiToggleButton-root": {
              backgroundColor:
                groupSelected === item.mcg_id ? "#8B0000 !important" : "transparent !important",
              color:
                groupSelected === item.mcg_id
                  ? "#fff !important"
                  : "rgba(211, 47, 47, 0.8) !important",
              border: "1px solid rgba(211, 47, 47, 0.3) !important",
            },
            "&:hover": {
              backgroundColor:
                groupSelected === item.mcg_id ? "#8B0000 !important" : "#a91c1c !important",
              color: "#fff !important",
            },
            "&.Mui-selected": {
              backgroundColor: "#8B0000 !important",
              color: "#fff !important",
              "&:hover": {
                backgroundColor: "#8B0000 !important",
                color: "#fff !important",
              },
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.3,
              fontSize: "inherit",
            }}
          >
            <span>
              {item.mcg_name} (
              {hasActiveFilters ? allGroupCounts[item.mcg_id] || 0 : item.customer_group_count || 0}
              )
            </span>
            {isLoadingCounts && <CircularProgress size={8} color="inherit" />}
          </Box>
        </ToggleButton>
      ))}
    </Box>
  );

  return <>{isMobile ? <MobileDropdown /> : <DesktopToggleButtons />}</>;
}

export default FilterTab;
