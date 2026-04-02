import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import { useGetCustomerCareSourcesQuery } from "../../../features/Notebook/notebookApi";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

const CustomerCareSourcePickerDialog = ({
  open,
  defaultSource = "customer",
  onClose,
  onSelect,
}) => {
  const [activeSource, setActiveSource] = useState(defaultSource);
  const [searchInput, setSearchInput] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveSource(defaultSource || "customer");
    setSearchInput("");
    setPaginationModel({
      page: 0,
      pageSize: 10,
    });
  }, [defaultSource, open]);

  useEffect(() => {
    setPaginationModel((previous) => ({
      ...previous,
      page: 0,
    }));
  }, [debouncedSearch]);

  const { data, isFetching, isLoading } = useGetCustomerCareSourcesQuery(
    {
      source: activeSource,
      search: debouncedSearch || undefined,
      page: paginationModel.page,
      per_page: paginationModel.pageSize,
    },
    {
      skip: !open,
    }
  );

  const rows = data?.rows || [];
  const total = data?.total || 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>เลือกข้อมูลลูกค้า</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Tabs
            value={activeSource}
            onChange={(_, value) => {
              setActiveSource(value);
              setPaginationModel((previous) => ({ ...previous, page: 0 }));
            }}
          >
            <Tab value="customer" label="Customer" />
            <Tab value="notebook" label="Notebook" />
          </Tabs>

          <TextField
            size="small"
            placeholder="ค้นหาชื่อบริษัท ชื่อลูกค้า ผู้ติดต่อ หรือเบอร์โทร"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />

          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <List disablePadding>
              {isLoading || isFetching ? (
                <ListItem sx={{ justifyContent: "center", py: 5 }}>
                  <Stack spacing={1} alignItems="center">
                    <CircularProgress size={28} />
                    <Typography variant="body2" color="text.secondary">
                      กำลังโหลดข้อมูล...
                    </Typography>
                  </Stack>
                </ListItem>
              ) : rows.length === 0 ? (
                <ListItem sx={{ py: 5, justifyContent: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    ไม่พบข้อมูลที่ตรงกับเงื่อนไข
                  </Typography>
                </ListItem>
              ) : (
                rows.map((item) => (
                  <ListItemButton
                    key={`${item.source_type}-${item.id}`}
                    onClick={() => onSelect?.(item)}
                    divider
                    sx={{ alignItems: "flex-start", py: 1.5 }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {item.label || "-"}
                          </Typography>
                          <Chip
                            label={item.source_type === "customer" ? "Customer" : "Notebook"}
                            size="small"
                            color={item.source_type === "customer" ? "success" : "info"}
                            variant="outlined"
                          />
                          {item.is_online ? (
                            <Chip label="Online" size="small" color="info" variant="outlined" />
                          ) : null}
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.25} sx={{ mt: 0.75 }}>
                          {item.contact_person ? (
                            <Typography variant="body2" color="text.secondary">
                              ผู้ติดต่อ: {item.contact_person}
                            </Typography>
                          ) : null}
                          {item.phone ? (
                            <Typography variant="body2" color="text.secondary">
                              โทร: {item.phone}
                            </Typography>
                          ) : null}
                          {item.email ? (
                            <Typography variant="body2" color="text.secondary">
                              อีเมล: {item.email}
                            </Typography>
                          ) : null}
                        </Stack>
                      }
                    />
                  </ListItemButton>
                ))
              )}
            </List>

            <TablePagination
              component="div"
              count={total}
              page={paginationModel.page}
              onPageChange={(_, page) =>
                setPaginationModel((previous) => ({
                  ...previous,
                  page,
                }))
              }
              rowsPerPage={paginationModel.pageSize}
              onRowsPerPageChange={(event) =>
                setPaginationModel({
                  page: 0,
                  pageSize: Number(event.target.value),
                })
              }
              rowsPerPageOptions={[5, 10, 20]}
            />
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerCareSourcePickerDialog;
