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
import { MdOutlineManageSearch } from "react-icons/md";
import { RiAddLargeFill } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";

import SubRoleDialogForm from "./SubRoleDialogForm";
import DataTable from "../../components/DataTable";
import TitleBar from "../../components/TitleBar";
import {
  useGetAllSubRolesQuery,
  useDeleteSubRoleMutation,
} from "../../features/UserManagement/userManagementApi";
import { setItemList, setMode } from "../../features/SubRoleManagement/subRoleManagementSlice";
import { swal_delete_by_id } from "../../utils/dialog_swal2/dialog_delete_by_id";
import {
  open_dialog_ok_timer,
  open_dialog_loading,
  open_dialog_error,
} from "../../utils/import_lib";

function SubRoleList() {
  const dispatch = useDispatch();
  const itemList = useSelector((state) => state.subRoleManagement?.itemList || []);
  const inputList = useSelector((state) => state.subRoleManagement?.inputList || {});
  const keyword = useSelector((state) => state.global.keyword);
  const [openDialog, setOpenDialog] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const { data, error, isLoading, isFetching, isSuccess } = useGetAllSubRolesQuery({
    page: paginationModel.page,
    per_page: paginationModel.pageSize,
    search: keyword,
  });
  const [deleteSubRole] = useDeleteSubRoleMutation();

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
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handleOpenDialog = (mode, msr_id = null) => {
    if (mode !== "create") {
      const itemFill = itemList.find((item) => item.msr_id === msr_id);
      if (itemFill) {
        reset(itemFill);
      }
    }

    if (mode === "create") {
      reset({
        msr_id: "",
        msr_code: "",
        msr_name: "",
        msr_description: "",
        msr_is_active: true,
        msr_sort: 0,
      });
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
    const confirmed = await swal_delete_by_id(`กรุณายืนยันการลบ Sub Role: ${params.msr_name}`);

    if (confirmed) {
      open_dialog_loading();

      try {
        const res = await deleteSubRole(params.msr_id).unwrap();

        if (res.status === "success") {
          open_dialog_ok_timer("ลบข้อมูลสำเร็จ");
        } else {
          open_dialog_error(res.message);
        }
      } catch (error) {
        open_dialog_error(error?.data?.message || error.message, error);
        console.error(error);
      }
    }
  };

  useEffect(() => {
    if (isSuccess) {
      if (data.status === "error") {
        open_dialog_error("Fetch sub roles error", data.message);
      } else if (data.data) {
        dispatch(setItemList(data.data));
        setTotalRows(data.pagination?.total_items || 0);
      }
    }
  }, [data]);

  const columns = useMemo(
    () => [
      {
        headerName: "ลำดับ",
        field: "no",
        width: 80,
        renderCell: (params) => {
          const rowIndex = params.api.getRowIndexRelativeToVisibleRows(params.rowNode.id);
          const result = paginationModel.page * paginationModel.pageSize + rowIndex + 1;
          return result;
        },
      },
      {
        field: "msr_code",
        headerName: "รหัส",
        width: 180,
      },
      {
        field: "msr_name",
        headerName: "ชื่อ Sub Role",
        width: 220,
      },
      {
        field: "msr_description",
        headerName: "รายละเอียด",
        flex: 1,
        minWidth: 200,
        valueGetter: (value) => (value ? value : "-"),
      },
      {
        field: "msr_is_active",
        headerName: "สถานะ",
        width: 120,
        renderCell: (params) => {
          if (params.row.msr_is_active) {
            return <Chip label="Active" size="small" color="success"></Chip>;
          } else {
            return <Chip label="Inactive" size="small" color="default"></Chip>;
          }
        },
      },
      {
        field: "msr_sort",
        headerName: "ลำดับแสดง",
        width: 100,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "tools",
        headerName: "TOOLS",
        width: 150,
        type: "actions",
        getActions: (params) => [
          <GridActionsCellItem
            icon={<MdOutlineManageSearch style={{ fontSize: 26 }} />}
            label="View"
            onClick={() => handleOpenDialog("view", params.row.msr_id)}
          />,
          <GridActionsCellItem
            icon={<CiEdit style={{ fontSize: 26 }} />}
            label="Edit"
            onClick={() => handleOpenDialog("edit", params.row.msr_id)}
          />,
          <GridActionsCellItem
            icon={<BsTrash3 style={{ fontSize: 22 }} />}
            label="Delete"
            onClick={() => handleDelete(params.row)}
          />,
        ],
      },
    ],
    [handleOpenDialog, handleDelete, paginationModel]
  );

  return (
    <div className="sub-role-management-list">
      <SubRoleDialogForm
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

      <TitleBar title="จัดการ Sub Role" />
      <Box paddingX={3} sx={{ margin: "auto", maxWidth: 1400, height: 750, paddingBlock: 3 }}>
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
          getRowId={(row) => row.msr_id}
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

export default SubRoleList;
