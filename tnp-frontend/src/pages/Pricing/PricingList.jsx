import {
  useState,
  useEffect,
  useMemo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  GridActionsCellItem,
  useGridApiContext,
  useGridSelector,
  gridPageCountSelector,
  gridPageSelector,
} from "@mui/x-data-grid";
import {
  Box,
  Button,
  Pagination,
  PaginationItem,
  styled,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { MdOutlineManageSearch } from "react-icons/md";
import { RiAddLargeFill } from "react-icons/ri";
import { CiEdit } from "react-icons/ci";
import { BsTrash3 } from "react-icons/bs";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { IoIosCheckmarkCircleOutline, IoIosCloseCircleOutline } from "react-icons/io";
import { useGetAllPricingQuery, useDelPricingReqMutation, useUpdatePricingReqMutation, useUpdatePricingReqStatusMutation } from "../../features/Pricing/pricingApi";
import {
  setItemList,
  setMode,
  resetInputList,
  setInputList,
  setTotalCount,
  setPaginationModel,
  setStatusList,
  setImagePreviewForm
} from "../../features/Pricing/pricingSlice";
import TitleBar from "../../components/TitleBar";
import FilterTab from "./FilterTab";
import { swal_delete_by_id } from "../../utils/dialog_swal2/dialog_delete_by_id";
import {
  open_dialog_ok_timer,
  open_dialog_loading,
  open_dialog_error,
  dialog_confirm_yes_no,
} from "../../utils/import_lib";
import StyledDataGrid from "../../components/StyledDataGrid";
import StyledPagination from "../../components/StyledPagination";
import { open_dialog_three_btn } from "../../utils/dialog_swal2/alart_one_line";

function PricingList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("userData"));
  const [totalItems, setTotalItems] = useState(0);
  const itemList = useSelector((state) => state.pricing.itemList);
  const statusSelected = useSelector((state) => state.pricing.statusSelected);
  const keyword = useSelector((state) => state.global.keyword);
  const paginationModel = useSelector((state) => state.pricing.paginationModel);
  const { data, error, isFetching, isLoading, isSuccess } = useGetAllPricingQuery({
    status: statusSelected,
    page: paginationModel.page,
    per_page: paginationModel.pageSize,
    user_id: user.user_uuid,
    search: keyword,
  }, { refetchOnFocus: true, refetchOnReconnect: true });
  const [delPricingReq] = useDelPricingReqMutation();
  const [updatePricingReqStatus] = useUpdatePricingReqStatusMutation();

  // แสดงปุ่มตามเงื่อนไข
  const getActionItems = (params, user) => {
    const actions = [];

    const isManagerOrProduction = (user.role === "manager" || user.role === "production");

    // สถานะที่ไม่ให้เซลแก้ไข
    const restrictedStatusForSale = [
      "20db8b15-092b-11f0-b223-38ca84abdf0a",   // รอทำราคา
      "20db8c29-092b-11f0-b223-38ca84abdf0a"    // แก้ไขรอทำราคา
    ].includes(params.row.pr_status_id);
    
    // สถานะที่สามารถลบข้อมูลได้
    const deletableStatus = [
      "20db7a92-092b-11f0-b223-38ca84abdf0a",   // รอส่งคำขอ
      "20db8cbf-092b-11f0-b223-38ca84abdf0a",   // ปฏิเสธงาน
    ].includes(params.row.pr_status_id);

    actions.push(
      <GridActionsCellItem
        icon={<MdOutlineManageSearch style={{ fontSize: 26 }} />}
        label="View"
        onClick={() => handleOpenForm("view", params.id)}
      />
    );

    const canEdit = user.role === "admin" 
      || (user.role === "sale" && !restrictedStatusForSale) 
      || (isManagerOrProduction && params.row.pr_status_id !== "20db7a92-092b-11f0-b223-38ca84abdf0a");   // กรณีเป็นผู้จัดการ ไม่แสดงปุ่มแก้ไขเฉพาะสถานะ "รอส่งคำขอ"
    const canDelete = (user.role === "admin" || user.role === "sale") && deletableStatus;

    if (canEdit) {
      actions.push(
        <GridActionsCellItem
          icon={<CiEdit style={{ fontSize: 26 }} />}
          label="Edit"
          onClick={() => handleOpenForm("edit", params.id)}
        />
      );
    }

    if (canDelete) {
      actions.push(
        <GridActionsCellItem
          icon={<BsTrash3 style={{ fontSize: 22 }} />}
          label="Delete"
          onClick={() => handleDelete(params.row)}
        />
      );
    }

    if (isManagerOrProduction) {

      // สถานะเป็น "รอทำราคา" หรือ "แก้ไขรอทำราคา"
      if (params.row.pr_status_id === "20db8b15-092b-11f0-b223-38ca84abdf0a"
          || params.row.pr_status_id === "20db8c29-092b-11f0-b223-38ca84abdf0a") 
      {
        actions.push(
          <GridActionsCellItem
          icon={<IoIosCloseCircleOutline style={{ fontSize: 28 }} />}
          label="Reject"
          onClick={() => handleReject(params.row)}
          />,
          <GridActionsCellItem
            icon={<IoIosCheckmarkCircleOutline style={{ fontSize: 28 }} />}
            label="Pricing"
            onClick={() => handleRequest(params.row, "pricing")}
          />
        );
      }
    }

    // แสดงปุ่มขอราคา กรณีเป็นเซลและคำขอมีสถานะเป็น "รอส่งคำขอ"
    if (params.row.pr_status_id === "20db7a92-092b-11f0-b223-38ca84abdf0a" && user.role === "sale") {
      actions.push(
        <GridActionsCellItem
          icon={<IoIosCheckmarkCircleOutline style={{ fontSize: 28 }} />}
          label="Request"
          onClick={() => handleRequest(params.row, "request")}
        />
      );
    }

    return actions;
  };

  // Pagination customize
  function CustomPagination() {
    const apiRef = useGridApiContext();
    const page = useGridSelector(apiRef, gridPageSelector);
    const pageCount = useGridSelector(apiRef, gridPageCountSelector);
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
      if (paginationModel.page !== page) {
        apiRef.current.setPage(0); 
      }
    }, [paginationModel])

    return (
      <StyledPagination
        color="error"
        variant="outlined"
        shape="rounded"
        page={page + 1}
        count={pageCount}
        siblingCount={ isXs ? 0 : 1 } 
        boundaryCount={1} 
        // @ts-expect-error
        renderItem={(props2) => 
          <PaginationItem 
            {...props2} 
            disableRipple 
            slots={{ previous: FaChevronLeft, next: FaChevronRight }}
          />
        }
        onChange={(event, value) => apiRef.current.setPage(value - 1)}
      />
    );
  }

  const handleOpenDialog = (mode, cus_id = null) => {
    if (mode !== "create") {
      const itemFill = itemList.find((item) => item.cus_id === cus_id);
      dispatch(setInputList(itemFill));
    }

    dispatch(setMode(mode));
    // setOpenDialog(true);
  };

  const handleOpenForm = (mode, pr_id = null) => {
    navigate(pr_id ? `/pricing/${mode}/${pr_id}` : `/pricing/${mode}`);
    dispatch(setMode(mode));
  };

  const handleDelete = async (params) => {
    const confirmed = await swal_delete_by_id(
      `กรุณายืนยันการลบคำขอราคาชื่องาน <br /> ${params.pr_work_name}`
    );

    if (confirmed) {
      open_dialog_loading();

      try {
        const res = await delPricingReq(params.pr_id);

        if (res.data.status === "success") {
          open_dialog_ok_timer("ลบข้อมูลสำเร็จ");
        }
      } catch (error) {
        open_dialog_error(error.message, error);
        console.error(error);
      }
    }
  };

  // ส่งคำขอโดยเซล และอนุมัติคำขอ(ให้ราคา) โดยผู้จัดการ
  const handleRequest = async (params, action) => {
    const textMap = {
      "request": "กรุณายืนยันการส่งคำขอราคา",
      "pricing": "กรุณายืนยันการให้ราคา",
    }
    const confirmed = await dialog_confirm_yes_no(
      `${textMap[action]}<br/>${params.pr_work_name}`
    );

    const data_input = {
      pr_id: params.pr_id,
      user_uuid: user.user_uuid,
      action: action
    }
    
    if (confirmed) {
      open_dialog_loading();
      
      try {
        const res = await updatePricingReqStatus(data_input).unwrap();

        if (res.status === "success") {
          open_dialog_ok_timer("บันทึกข้อมูลสำเร็จ");
        }

      } catch (error) {
        console.error("handleRequest Error", error);
        open_dialog_error("handleRequest Error", error?.data.message);
      }
    }
  };

  // ปฏิเสธคำขอโดยผู้จัดการ
  const handleReject = async (params) => {
    let action = null;
    const reject_result = await open_dialog_three_btn("เหตุผลการปฏิเสธคำขอ", "ยกเลิก", "ปฏิเสธงาน", "ทำราคาไม่ได้");

    if (reject_result.isConfirmed) {
      action = "reject"   // ปฏิเสธงาน
    } else if (reject_result.isDenied) {
      action = "cannot_pricing"   // ทำราคาไม่ได้
    } else {
      return;
    }

    const data_input = {
      pr_id: params.pr_id,
      user_uuid: user.user_uuid,
      action: action
    }

    open_dialog_loading();
    
    try {
      const res = await updatePricingReqStatus(data_input).unwrap();

      if (res.status === "success") {
        open_dialog_ok_timer("บันทึกข้อมูลสำเร็จ");
      }

    } catch (error) {
      console.error("handleReject Error", error);
      open_dialog_error("handleReject Error", error?.data.message);
    }
  };

  // Render when not found data.
  const NoDataComponent = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: "gray",
      }}
    >
      <p style={{ fontSize: 18 }}>No data found.</p>
    </div>
  );

  useEffect(() => {
    if (isSuccess) {
      if (data.status === "error") {
        open_dialog_error("Fetch pricing requests error", data.message);
      } else if (data.data) {
        dispatch(setItemList(data.data));
        dispatch(setStatusList(data.status));
        dispatch(setTotalCount(data.total_count));
        setTotalItems(data.pagination.total_items);
      }
    }

    // reset state input list
    dispatch(resetInputList());
    dispatch(setImagePreviewForm(""));

  }, [data]);

  const columns = useMemo(
    () => [
      {
        field: "pr_no",
        headerName: "ID",
        width: 160,
      },
      {
        field: "created_name",
        headerName: "SELLER",
        width: 130,
        cellClassName: "uppercase-cell",
      },
      {
        field: "pr_work_name",
        headerName: "WORK NAME",
        width: 240,
        hideable: false,
      },
      { field: "cus_name", headerName: "CUSTOMER", width: 240 },
      { 
        field: "pr_quantity", 
        headerName: "QUANTITY", 
        width: 140,
        renderCell: (params) => {
          let result = params.row?.pr_quantity;

          if (params.row?.pr_quantity.length > 3) {
            const formattedText = params.row?.pr_quantity.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            result = formattedText;
          }

          return result;
        },
      },
      { 
        field: "prince", 
        headerName: "PRICE", 
        width: 240,
        renderCell: (params) => {

          if (params.row?.note_price.length > 0) {

            const latestNote = params.row?.note_price.reduce((latest, current) => {
              return new Date(current.prn_created_date) > new Date(latest.prn_created_date)
              ? current
              : latest;
            });

            return latestNote.prn_text;
          }

          return '-';
        },
      
      },
      { field: "status", headerName: "STATUS", width: 280 },
      {
        field: "tools",
        headerName: "TOOLS",
        flex: 1,
        minWidth: 280,
        type: "actions",
        getActions: (params) => getActionItems(params, user),
      },
    ],
    [handleOpenDialog, handleDelete]
  );

  return (
    <div className="pricing-list">
     
      <TitleBar title="pricing" />
      <Box
        paddingX={3}
        sx={{ margin: "auto", maxWidth: 1800, height: `calc(100vh - 160px)`, paddingBlock: 3 }}
      >
        {/* Button on top table */}
        <TableContainer>
          <Table sx={{ marginBottom: 2 }}>
            <TableBody>
              <TableRow>
                { user.role === "sale" || user.role === "admin" ? (
                <TableCell sx={{ padding: 0, border: 0, width: 0 }}>
                  <Button
                    variant="icon-contained"
                    color="grey"
                    onClick={() => handleOpenForm('create')}
                    sx={{
                      marginRight: 3,
                      height: 40,
                      padding: 0,
                    }}
                  >
                    <RiAddLargeFill style={{ width: 24, height: 24 }} />
                  </Button>
                </TableCell>
                ) : null }
                <TableCell sx={{ padding: 0, border: 0 }}>
                  <FilterTab statusIsLoading={isLoading} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <StyledDataGrid
          disableRowSelectionOnClick
          paginationMode="server"
          rows={itemList}
          columns={columns}
          getRowId={(row) => row.pr_id}
          initialState={{ pagination: { paginationModel } }}
          onPaginationModelChange={(model) => dispatch(setPaginationModel(model))}
          rowCount={totalItems}
          loading={isFetching}
          slots={{
            noRowsOverlay: NoDataComponent,
            pagination: CustomPagination,
          }}
          sx={{ border: 0 }}
          rowHeight={50}
          columnHeaderHeight={50}
        />
      </Box>
    </div>
  );
}

export default PricingList;
