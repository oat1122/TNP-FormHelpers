/**
 * ManagerSection.jsx - Customer manager assignment (Admin only)
 *
 * Used in:
 * - AdditionalInfoTab (DialogForm)
 *
 * Features:
 * - Admin: Can select any sales user as manager
 * - Non-admin: Auto-assigned to current user (display only)
 * - Auto-sets manager on create mode for non-admin users
 *
 * @module Forms/sections/ManagerSection
 */
import React, { useEffect } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
} from "@mui/material";
import { MdSupervisorAccount } from "react-icons/md";

// Shared UI Primitives
import { StyledTextField } from "../ui/FormFields";
import { SectionHeader } from "../ui/SectionHeader";

/**
 * ManagerSection - ผู้ดูแลลูกค้า (Admin only editable)
 *
 * @param {object} inputList - Form data object
 * @param {object} errors - Validation errors
 * @param {function} handleInputChange - Input change handler
 * @param {string} mode - "create" | "edit" | "view"
 * @param {array} salesList - Available sales users for selection
 * @param {boolean} showHeader - Whether to show section header (default: true)
 */
export const ManagerSection = ({
  inputList = {},
  errors = {},
  handleInputChange,
  mode = "create",
  salesList = [],
  showHeader = true,
}) => {
  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("userData") || "{}");
  const isAdmin = currentUser.role === "admin";

  // Auto-set manager for non-admin users in create mode
  useEffect(() => {
    if (!isAdmin && currentUser.user_id && mode === "create") {
      if (!inputList.cus_manage_by?.user_id) {
        const managedBy = {
          user_id: currentUser.user_id,
          username: currentUser.username || currentUser.user_nickname || "คุณ",
        };

        setTimeout(() => {
          const syntheticEvent = {
            target: {
              name: "cus_manage_by",
              value: managedBy,
            },
          };
          handleInputChange(syntheticEvent);
        }, 100);
      }
    }
  }, [isAdmin, currentUser.user_id, mode]);

  // Handle manager dropdown change
  const handleManagerChange = (event) => {
    const selectedUserId = event.target.value;

    if (selectedUserId === "" || selectedUserId === null || selectedUserId === undefined) {
      const managedBy = { user_id: "", username: "" };
      handleInputChange({
        target: { name: "cus_manage_by", value: managedBy },
      });
    } else {
      const selectedUser = salesList.find(
        (user) => String(user.user_id) === String(selectedUserId)
      );

      if (selectedUser) {
        const managedBy = {
          user_id: selectedUser.user_id,
          username:
            selectedUser.username || selectedUser.user_nickname || `User ${selectedUser.user_id}`,
        };
        handleInputChange({
          target: { name: "cus_manage_by", value: managedBy },
        });
      }
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      {showHeader && (
        <SectionHeader
          icon={MdSupervisorAccount}
          title="ผู้ดูแลลูกค้า"
          subtitle="กำหนดผู้รับผิดชอบดูแลลูกค้ารายนี้"
        />
      )}

      {isAdmin ? (
        <FormControl fullWidth disabled={mode === "view"} size="small">
          <InputLabel sx={{ fontFamily: "Kanit", fontSize: 14 }}>เลือกผู้ดูแลลูกค้า</InputLabel>
          <Select
            name="cus_manage_by_select"
            value={inputList.cus_manage_by?.user_id || ""}
            onChange={handleManagerChange}
            label="เลือกผู้ดูแลลูกค้า"
            error={!!errors.cus_manage_by}
            sx={{
              fontFamily: "Kanit",
              fontSize: 14,
              bgcolor: "white",
            }}
          >
            <MenuItem value="" sx={{ fontFamily: "Kanit" }}>
              ไม่มีผู้ดูแล
            </MenuItem>
            {salesList.map((user) => (
              <MenuItem
                key={user.user_id}
                value={String(user.user_id)}
                sx={{ fontFamily: "Kanit" }}
              >
                {user.username || user.user_nickname || `User ${user.user_id}`}
              </MenuItem>
            ))}
          </Select>
          {errors.cus_manage_by && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, fontFamily: "Kanit" }}>
              {errors.cus_manage_by}
            </Typography>
          )}
        </FormControl>
      ) : (
        <Stack spacing={2}>
          <StyledTextField
            mode={mode}
            name="cus_manage_by_display"
            label="ผู้ดูแลลูกค้า"
            value={
              inputList.cus_manage_by?.username ||
              currentUser.username ||
              currentUser.user_nickname ||
              "คุณ"
            }
            disabled
          />
          <Alert severity="info" sx={{ fontFamily: "Kanit" }}>
            คุณจะเป็นผู้ดูแลลูกค้ารายนี้โดยอัตโนมัติ
          </Alert>
        </Stack>
      )}
    </Box>
  );
};

export default ManagerSection;
