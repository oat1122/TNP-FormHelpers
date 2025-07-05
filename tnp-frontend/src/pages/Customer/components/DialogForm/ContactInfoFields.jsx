import React, { useEffect } from "react";
import { Grid, InputAdornment, Box, Typography, Paper, FormControl, InputLabel, MenuItem, CircularProgress } from "@mui/material";
import { MdPhone, MdEmail, MdContactPhone, MdReceipt, MdSignalCellularAlt, MdBusiness, MdPerson } from "react-icons/md";
import { StyledTextField, StyledSelect } from "./StyledComponents";
import { useGetAllBusinessTypesQuery, useGetUserByRoleQuery } from "../../../../features/globalApi";

const channelOptions = [
  { value: "1", label: "Sales" },
  { value: "2", label: "Online" },
  { value: "3", label: "Office" },
];

function ContactInfoFields({ inputList, handleInputChange, errors, mode, businessTypeList = [], userList = [] }) {
  // ดึงข้อมูล user ปัจจุบันจาก localStorage
  const currentUser = JSON.parse(localStorage.getItem("userData"));
  const isAdmin = currentUser?.role === "admin";
  const isSales = currentUser?.role === "sale";

  const {
    data: apiBusinessTypes,
    isLoading: loadingBusinessTypes,
  } = useGetAllBusinessTypesQuery();

  // ดึงข้อมูล users ตาม role (admin ดูได้ทุกคน, sales ดูเฉพาะ sales)
  const { data: apiUsers, isLoading: loadingUsers, error: usersError } = useGetUserByRoleQuery(
    isAdmin ? 'sale,manager,admin' : 'sale', // Admin ดูได้หลาย roles
    { skip: userList.length > 0 }
  );

  const mergedBusinessTypes = businessTypeList.length > 0 ? businessTypeList : apiBusinessTypes || [];

  // จัดการข้อมูล users สำหรับผู้ดูแล
  let mergedUserList = [];
  if (userList.length > 0) {
    mergedUserList = userList;
  } else if (apiUsers) {
    if (isAdmin) {
      // Admin รวม users จากทุก role ที่ได้
      const allRoleUsers = [];
      ['sale_role', 'manager_role', 'admin_role'].forEach(roleKey => {
        if (apiUsers[roleKey] && Array.isArray(apiUsers[roleKey])) {
          allRoleUsers.push(...apiUsers[roleKey]);
        }
      });
      mergedUserList = allRoleUsers;
    } else if (isSales) {
      // Sales ดูเฉพาะ sales role
      if (apiUsers.sale_role && Array.isArray(apiUsers.sale_role)) {
        mergedUserList = apiUsers.sale_role;
      }
    }
  }

  // Fallback: หากไม่มีข้อมูลจาก API ให้ใช้ currentUser
  if (mergedUserList.length === 0 && currentUser) {
    mergedUserList = [currentUser];
  }

  // useEffect สำหรับ auto-assign ผู้ดูแลถ้าเป็น sales role
  useEffect(() => {
    if (isSales && !inputList.cus_manage_by && mode !== 'view' && currentUser?.user_id) {
      // Auto-assign ผู้ดูแลเป็นตัวเอง
      const fakeEvent = {
        target: {
          name: 'cus_manage_by',
          value: currentUser.user_id
        }
      };
      handleInputChange(fakeEvent);
    }
  }, [isSales, currentUser?.user_id, inputList.cus_manage_by, mode, handleInputChange]);
  return (
    <Box>
      {/* ส่วนข้อมูลการติดต่อ */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography 
          variant="subtitle2" 
          sx={{ 
            mb: 2, 
            display: 'flex',
            alignItems: 'center',
            color: 'text.secondary',
            fontWeight: 500
          }}
        >
          <MdContactPhone style={{ marginRight: 8 }} /> ข้อมูลการติดต่อ
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <StyledTextField
              fullWidth
              required
              label="เบอร์โทรศัพท์"
              size="small"
              name="cus_tel_1"
              placeholder="เบอร์"
              value={inputList.cus_tel_1 || ""}
              onChange={handleInputChange}
              error={!!errors.cus_tel_1}
              helperText={errors.cus_tel_1}
              InputProps={{
                readOnly: mode === "view",
                startAdornment: (
                  <InputAdornment position="start">
                    <MdPhone style={{ color: '#4caf50' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <StyledTextField
              fullWidth
              label="เบอร์สำรอง"
              size="small"
              name="cus_tel_2"
              placeholder="เบอร์สำรอง"
              value={inputList.cus_tel_2 || ""}
              onChange={handleInputChange}
              InputProps={{
                readOnly: mode === "view",
                startAdornment: (
                  <InputAdornment position="start">
                    <MdPhone style={{ color: '#ff9800' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <StyledTextField
              fullWidth
              label="อีเมล"
              size="small"
              name="cus_email"
              placeholder="อีเมล"
              type="email"
              value={inputList.cus_email || ""}
              onChange={handleInputChange}
              InputProps={{
                readOnly: mode === "view",
                startAdornment: (
                  <InputAdornment position="start">
                    <MdEmail style={{ color: '#2196f3' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ส่วนข้อมูลทางภาษี */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography 
          variant="subtitle2" 
          sx={{ 
            mb: 2, 
            display: 'flex',
            alignItems: 'center',
            color: 'text.secondary',
            fontWeight: 500
          }}
        >
          <MdReceipt style={{ marginRight: 8 }} /> ข้อมูลทางภาษี
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <StyledTextField
              fullWidth
              label="เลขผู้เสียภาษี"
              size="small"
              name="cus_tax_id"
              placeholder="เลขผู้เสียภาษี (13 หลัก)"
              value={inputList.cus_tax_id || ""}
              onChange={handleInputChange}
              InputProps={{ 
                readOnly: mode === "view",
                startAdornment: (
                  <InputAdornment position="start">
                    <MdReceipt />
                  </InputAdornment>
                ),
              }}
              helperText={inputList.cus_tax_id && inputList.cus_tax_id.length !== 13 ? "เลขผู้เสียภาษีควรมี 13 หลัก" : ""}
              error={inputList.cus_tax_id && inputList.cus_tax_id.length !== 13}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ส่วนรายละเอียดธุรกิจ */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            color: 'text.secondary',
            fontWeight: 500
          }}
        >
          <MdBusiness style={{ marginRight: 8 }} /> รายละเอียดธุรกิจ
          <span style={{ color: 'red', marginLeft: 4 }}>*</span>
          {(loadingBusinessTypes || loadingUsers) && (
            <CircularProgress size={16} sx={{ ml: 1 }} />
          )}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>ประเภทธุรกิจ</InputLabel>
              <StyledSelect
                label="ประเภทธุรกิจ"
                name="cus_bt_id"
                value={inputList.cus_bt_id || ''}
                onChange={handleInputChange}
                readOnly={mode === 'view'}
              >
                <MenuItem disabled value="">
                  เลือกประเภทธุรกิจ
                </MenuItem>
                {mergedBusinessTypes.map((item) => (
                  <MenuItem key={item.bt_id} value={item.bt_id}>
                    {item.bt_name}
                  </MenuItem>
                ))}
              </StyledSelect>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>ช่องทาง</InputLabel>
              <StyledSelect
                label="ช่องทาง"
                name="cus_channel"
                value={inputList.cus_channel || ''}
                onChange={handleInputChange}
                readOnly={mode === 'view'}
              >
                <MenuItem disabled value="">
                  ช่องทางการติดต่อ
                </MenuItem>
                {channelOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </StyledSelect>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl 
              fullWidth 
              size="small"
              disabled={mode === 'view'} // แก้ไข: เอา isSales ออก เพื่อให้สามารถเลือกได้
            >
              <InputLabel>ผู้ดูแล</InputLabel>
              <StyledSelect
                label="ผู้ดูแล"
                name="cus_manage_by"
                value={inputList.cus_manage_by || ''} // แก้ไข: ใช้ค่าใน inputList โดยตรง
                onChange={handleInputChange}
                readOnly={isSales && mode !== 'view'} // แก้ไข: ใช้ readOnly แทน disabled สำหรับ sales
                sx={{
                  '& .MuiInputBase-input': {
                    backgroundColor: isSales && mode !== 'view' ? '#f5f5f5' : 'inherit'
                  }
                }}
              >
                <MenuItem value="">ไม่มีผู้ดูแล</MenuItem>
                {mergedUserList.map((user) => (
                  <MenuItem key={user.user_id} value={user.user_id}>
                    {user.user_nickname || user.username}
                    {user.role && isAdmin && ` (${user.role})`}
                    {user.user_id === currentUser?.user_id && ' (คุณ)'}
                  </MenuItem>
                ))}
              </StyledSelect>
              {isSales && mode !== 'view' && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  คุณถูกกำหนดเป็นผู้ดูแลโดยอัตโนมัติ
                </Typography>
              )}
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default ContactInfoFields;
