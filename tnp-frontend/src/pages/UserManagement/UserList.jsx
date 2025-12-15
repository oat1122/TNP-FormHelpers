import {
  Box,
  Button,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
} from "@mui/material";
import { GridActionsCellItem } from "@mui/x-data-grid";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { BsTrash3 } from "react-icons/bs";
import { CiEdit } from "react-icons/ci";
import { MdOutlineManageSearch, MdLockReset } from "react-icons/md";
import { RiAddLargeFill } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";

import DialogForm from "./DialogForm";
import DataTable from "../../components/DataTable";
import TitleBar from "../../components/TitleBar";
import {
  useGetAllUserQuery,
  useResetPasswordMutation,
  useDelUserMutation,
} from "../../features/UserManagement/userManagementApi";
import { setItemList, setMode } from "../../features/UserManagement/userManagementSlice";
import { swal_delete_by_id } from "../../utils/dialog_swal2/dialog_delete_by_id";
import {
  open_dialog_ok_timer,
  open_dialog_loading,
  open_dialog_error,
  dialog_confirm_yes_no,
} from "../../utils/import_lib";

function UserList() {
  const user = JSON.parse(localStorage.getItem("userData"));
  const dispatch = useDispatch();
  const itemList = useSelector((state) => state.userManagement.itemList);
  const inputList = useSelector((state) => state.userManagement.inputList);
  const keyword = useSelector((state) => state.global.keyword);
  const [openDialog, setOpenDialog] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const { data, error, isLoading, isFetching, isSuccess } = useGetAllUserQuery({
    page: paginationModel.page,
    per_page: paginationModel.pageSize,
    search: keyword,
  });
  const [resetPassword] = useResetPasswordMutation();
  const [delUser] = useDelUserMutation();

  const {
    register,
    getValues,
    setValue,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: inputList,
    mode: "onChange", // ตรวจสอบความถูกต้องขณะกรอก
    reValidateMode: "onChange",
  });

  const handleOpenDialog = (mode, user_uuid = null) => {
    if (mode !== "create") {
      const itemFill = itemList.find((item) => item.user_uuid === user_uuid);

      if (itemFill) {
        reset(itemFill);
      }
      setValue("user_updated_by", user.user_uuid);
    }

    if (mode === "create") {
      setValue("user_created_by", user.user_uuid);
      setValue("user_updated_by", user.user_uuid);
    }

    dispatch(setMode(mode));
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);

    setTimeout(() => {
      reset(inputList);
      dispatch(setMode(""));
    }, 500);
  };

  const handleDelete = async (params) => {
    const confirmed = await swal_delete_by_id(`กรุณายืนยันการลบข้อมูล ${params.user_nickname}`);

    if (confirmed) {
      open_dialog_loading();

      try {
        const res = await delUser(params.user_uuid).unwrap();

        if (res.status === "success") {
          open_dialog_ok_timer("ลบข้อมูลสำเร็จ");
        }
      } catch (error) {
        open_dialog_error(error.message, error);
        console.error(error);
      }
    }
  };

  const handleResetPassword = async (params) => {
    const confirmed = await dialog_confirm_yes_no("คุณต้องการที่จะรีเซ็ทรหัสผ่านหรือไม่?");

    if (confirmed) {
      open_dialog_loading();

      try {
        const res = await resetPassword({ ...params, is_reset: true }).unwrap();

        if (res.status === "success") {
          open_dialog_ok_timer("รีเซ็ทรหัสผ่านสำเร็จ");
        } else {
          open_dialog_error(res.message);
        }
      } catch (error) {
        open_dialog_error(error.message, error);
        console.error(error);
      }
    }
  };

  useEffect(() => {
    if (isSuccess) {
      if (data.status === "error") {
        open_dialog_error("Fetch user error", data.message);
      } else if (data.data) {
        dispatch(setItemList(data.data));
        setTotalRows(data.pagination.total_items);
      }
    }
  }, [data]);

  const columns = useMemo(
    () => [
      {
        headerName: "no",
        field: "no",
        width: 130,
        renderCell: (params) => {
          const rowIndex = params.api.getRowIndexRelativeToVisibleRows(params.rowNode.id);
          const result = paginationModel.page * paginationModel.pageSize + rowIndex + 1;
          return result;
        },
      },
      {
        field: "user_emp_no",
        headerName: "emp no",
        width: 180,
        valueGetter: (value) => (value ? value : "-"),
      },
      {
        field: "user_nickname",
        headerName: "name",
        width: 260,
      },
      {
        field: "role",
        headerName: "role",
        width: 120,
        cellClassName: "capitalize-cell",
      },
      {
        field: "sub_roles",
        headerName: "Sub Roles",
        width: 200,
        renderCell: (params) => {
          const subRoles = params.row.sub_roles || [];
          if (subRoles.length === 0) return "-";
          return (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
              {subRoles.map((sr, index) => (
                <Chip
                  key={sr.msr_id || index}
                  label={sr.msr_name}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.75rem" }}
                />
              ))}
            </div>
          );
        },
      },
      {
        field: "username",
        headerName: "username",
        width: 180,
      },
      {
        field: "status",
        headerName: "status",
        width: 120,
        renderCell: (params) => {
          if (params.row.user_is_enable) {
            return <Chip label="Active" size="small" color="success"></Chip>;
          } else {
            return <Chip label="Non Active" size="small" color="gray"></Chip>;
          }
        },
      },
      {
        field: "tools",
        headerName: "TOOLS",
        flex: 1,
        minWidth: 220,
        type: "actions",
        getActions: (params) =>
          [
            <GridActionsCellItem
              icon={<MdLockReset style={{ fontSize: 26 }} />}
              label="Reset Password"
              onClick={() => handleResetPassword(params.row)}
            />,

            <GridActionsCellItem
              icon={<MdOutlineManageSearch style={{ fontSize: 26 }} />}
              label="View"
              onClick={() => handleOpenDialog("view", params.row.user_uuid)}
            />,

            <GridActionsCellItem
              icon={<CiEdit style={{ fontSize: 26 }} />}
              label="Edit"
              onClick={() => handleOpenDialog("edit", params.row.user_uuid)}
            />,

            params.row.user_uuid !== user.user_uuid && (
              <GridActionsCellItem
                icon={<BsTrash3 style={{ fontSize: 22 }} />}
                label="Delete"
                onClick={() => handleDelete(params.row)}
              />
            ),
          ].filter(Boolean),
      },
    ],
    [handleOpenDialog, handleDelete]
  );

  return (
    <div className="user-management-list">
      <DialogForm
        openDialog={openDialog}
        handleCloseDialog={handleCloseDialog}
        register={register}
        setValue={setValue}
        getValues={getValues}
        handleSubmit={handleSubmit}
        control={control}
        errors={errors}
        watch={watch}
      />

      <TitleBar title="user-management" />
      <Box paddingX={3} sx={{ margin: "auto", maxWidth: 1800, height: 750, paddingBlock: 3 }}>
        {/* Button on top table */}
        <TableContainer>
          <Table sx={{ marginBottom: 2 }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ padding: 0, border: 0, width: 0 }}>
                  <Button
                    variant="icon-contained"
                    color="grey"
                    onClick={() => handleOpenDialog("create")}
                    sx={{
                      marginRight: 3,
                      height: 40,
                      padding: 0,
                    }}
                  >
                    <RiAddLargeFill style={{ width: 24, height: 24 }} />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <DataTable
          data={itemList}
          columns={columns}
          loading={isFetching}
          getRowId={(row) => row.user_id + 1}
          paginationModel={paginationModel}
          setPaginationModel={setPaginationModel}
          rowCount={totalRows}
          rowHeight={50}
          columnHeaderHeight={50}
        />
      </Box>
    </div>
  );
}

export default UserList;
