import { Box, Chip, IconButton, Tooltip } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { MdDelete, MdEdit, MdPersonAdd } from "react-icons/md";

const NotebookTable = ({
  data,
  isLoading,
  total,
  paginationModel,
  onPaginationModelChange,
  onEdit,
  onDelete,
  onConvert,
}) => {
  const columns = [
    {
      field: "nb_date",
      headerName: "วันที่",
      flex: 1,
      minWidth: 100,
      renderCell: (params) => {
        const formatDate = (date) => {
          if (!date) return "";
          try {
            return format(new Date(date), "dd/MM/yyyy", { locale: th });
          } catch {
            return "";
          }
        };

        return (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Box component="span" sx={{ lineHeight: 1.2 }}>
              {formatDate(params.row.created_at)}
            </Box>
            <Box
              component="span"
              sx={{ lineHeight: 1.2, fontSize: "0.55rem", color: "text.secondary" }}
            >
              อัพเดทล่าสุด {formatDate(params.row.updated_at)}
            </Box>
          </Box>
        );
      },
    },

    {
      field: "nb_customer_name",
      headerName: "ชื่อลูกค้า",
      flex: 1.5,
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {params.value}
          {params.row.nb_is_online && (
            <Chip
              label="Online"
              color="info"
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: "0.7rem" }}
            />
          )}
        </Box>
      ),
    },
    {
      field: "nb_additional_info",
      headerName: "เพิ่มเติม",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "nb_contact_number",
      headerName: "เบอร์ติดต่อ",
      flex: 1,
      minWidth: 100,
    },
    {
      field: "nb_email",
      headerName: "Email",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "nb_contact_person",
      headerName: "ชื่อผู้ติดต่อ",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "nb_action",
      headerName: "การกระทำ",
      flex: 1,
      minWidth: 120,
      renderCell: (params) =>
        params.value ? (
          <Chip label={params.value} size="small" color="primary" variant="outlined" />
        ) : (
          ""
        ),
    },
    {
      field: "nb_status",
      headerName: "สถานะ",
      flex: 1,
      minWidth: 100,
      renderCell: (params) => {
        let color = "default";
        if (params.value === "ได้งาน") color = "success";
        if (params.value === "พิจารณา") color = "info";
        if (params.value === "ยังไม่แผนทำ") color = "warning";
        if (params.value === "หลุด" || params.value === "ไม่ได้งาน") color = "error";

        return params.value ? <Chip label={params.value} color={color} size="small" /> : "";
      },
    },
    {
      field: "nb_remarks",
      headerName: "หมายเหตุ",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "actions",
      headerName: "จัดการ",
      flex: 1,
      minWidth: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="สร้างลูกค้า">
            <span>
              <IconButton
                color="success"
                onClick={() => onConvert(params.row)}
                disabled={!!params.row.nb_converted_at}
              >
                <MdPersonAdd />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="แก้ไข">
            <span>
              <IconButton
                color="primary"
                onClick={() => onEdit(params.row)}
                disabled={!!params.row.nb_converted_at}
              >
                <MdEdit />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="ลบ">
            <span>
              <IconButton
                color="error"
                onClick={() => onDelete(params.row.id)}
                disabled={!!params.row.nb_converted_at}
              >
                <MdDelete />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ height: 600, width: "100%", bgcolor: "white", p: 2, borderRadius: 2 }}>
      <DataGrid
        rows={data || []}
        columns={columns}
        loading={isLoading}
        rowCount={total || 0}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        pageSizeOptions={[15, 30, 50]}
        disableRowSelectionOnClick
        sx={{
          border: "none",
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid #f0f0f0",
          },
          "& .MuiDataGrid-columnHeaders": {
            bgcolor: "#f5f5f5",
            borderBottom: "1px solid #e0e0e0",
          },
        }}
      />
    </Box>
  );
};

export default NotebookTable;
