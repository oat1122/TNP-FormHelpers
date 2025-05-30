import {
  useDispatch,
  useEffect,
  useMemo,
  useSelector,
  useState,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Toolbar,
  Tooltip,
  Typography,
  TextField,
  InputAdornment,
} from "../../../utils/import_lib";
import PropTypes from 'prop-types';
import { visuallyHidden } from '@mui/utils';
import { setCustomerSelected, setCustomerList } from "../../../features/Worksheet/worksheetSlice.js";
import { useGetAllCustomerQuery } from "../../../features/Worksheet/worksheetApi";
import { skipToken } from "@reduxjs/toolkit/dist/query/index.js";
import { IoSearch } from "react-icons/io5";

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

const headCells = [
  {
    id: 'cus_name',
    numeric: false,
    disablePadding: false,
    label: 'ชื่อลูกค้า',
  },
  {
    id: 'cus_company',
    numeric: false,
    disablePadding: false,
    label: 'ชื่อบริษัท',
  },
  {
    id: 'cus_address',
    numeric: false,
    disablePadding: false,
    label: 'ที่อยู่',
  },
  {
    id: 'cus_tel_1',
    numeric: true,
    disablePadding: false,
    label: 'เบอร์โทร',
  },
  {
    id: 'cus_email',
    numeric: false,
    disablePadding: false,
    label: 'อีเมล',
  },
];

function EnhancedTableHead(props) {
  const { order, orderBy, onRequestSort, onSearchChange } =
    props;
  const [searchQuery, setSearchQuery] = useState('');

  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  const handleSearchChange = (event) => {
    const newSearchQuery = event.target.value;
    setSearchQuery(newSearchQuery);
    onSearchChange(newSearchQuery); // Pass the search query to the parent
  };


  return (
    <TableHead>
      <TableRow>
        <TableCell sx={{ paddingTop: 1, paddingLeft: 1, }}>
          <TextField
            fullWidth
            label="Search"
            value={searchQuery}
            onChange={handleSearchChange}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IoSearch />
                  </InputAdornment>
                ),
              }
            }}
          />
        </TableCell>
        <TableCell colSpan={headCells.length - 1} />
      </TableRow>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired, 
};

function CustomerSectDialog({ open, close }) {
  const dispatch = useDispatch();
  const customerList = useSelector((state) => state.worksheet.customerList);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('calories');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [countData, setCountData] = useState(0);
  const queryArg = !open ? skipToken : {};
  const { data, isLoading } = useGetAllCustomerQuery(queryArg);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleClick = (event, id) => {
    dispatch(setCustomerSelected(id));
    close();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setPage(0);
  };

  const visibleRows = useMemo(
    () => {
      const filteredList = customerList.filter((customer) => {
        return Object.values(customer).some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        );
      });

      setCountData(filteredList.length);

      return filteredList
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    },
    [customerList, order, orderBy, page, rowsPerPage, searchQuery] // Add searchQuery to dependencies
  );

  useEffect(() => {
    if (data) {
      dispatch(setCustomerList(data));
    }
  }, [data])

  useEffect(() => {
    if (searchQuery.length > 0) {
      setSearchQuery('');
    }

    setPage(0);
  }, [close])

  return (
    <>
      <Dialog 
        open={open} 
        onClose={close}
        maxWidth="lg"
        fullWidth
        aria-hidden={open ? false : true}
        className="customer-dialog"
      >
        <DialogContent>
            <Toolbar
              sx={[
                {
                  pl: { sm: 2 },
                  pr: { xs: 1, sm: 1 },
                },
              ]}
            >
                <Typography
                  variant="h5"
                  id="tableTitle"
                  component="div"
                  color="error"
                  sx={{ 
                    flex: '1 1 100%',
                    fontSize: 22, 
                  }}
                >
                  รายชื่อลูกค้า
                </Typography>

            </Toolbar>
            <TableContainer>
              <Table
                sx={{ minWidth: 750 }}
                aria-labelledby="tableTitle"
              >
                <EnhancedTableHead
                  order={order}
                  orderBy={orderBy}
                  onRequestSort={handleRequestSort}
                  onSearchChange={handleSearchChange}
                />
                <TableBody>
                  {!isLoading ? visibleRows.map((row, index) => {

                    return (
                      <TableRow
                        hover
                        onClick={(event) => handleClick(event, row.cus_id)}
                        tabIndex={-1}
                        key={row.cus_id}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell
                          component="th"
                          scope="row"
                        >
                          {row.cus_name}
                        </TableCell>
                        <TableCell>{row.cus_company}</TableCell>
                        <TableCell>{row.cus_address}</TableCell>
                        <TableCell>{row.cus_tel_1}</TableCell>
                        <TableCell>{row.cus_email}</TableCell>
                      </TableRow>
                    );
                  }) : 
                    <TableRow
                        style={{
                          height: 80,
                        }}
                      >
                      <TableCell colSpan={5} align="center">Data Loading...</TableCell>
                    </TableRow>
                  }
                  {!isLoading && customerList.length === 0 && (
                    <TableRow
                      style={{
                        height: 80,
                      }}
                    >
                      <TableCell colSpan={5} align="center">No customer data</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={countData}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button variant="outlined" color="error" onClick={close}>ปิด</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default CustomerSectDialog