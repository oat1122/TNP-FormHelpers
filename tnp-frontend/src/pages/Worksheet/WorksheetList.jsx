import {
  AppBar,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  Container,
  CircularProgress,
  Grid2 as Grid,
  Slide,
  Toolbar,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import { useState, forwardRef, useEffect, useRef, useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { Link, useParams } from "react-router-dom";

import WorksheetCard from "./WorksheetCard";
import WorksheetFilter from "./WorksheetFilter";
import WorksheetListSkeleton from "./WorksheetListSkeleton";
import "./Worksheet.css";
import TitleBar from "../../components/TitleBar";
import { useGetAllWorksheetQuery } from "../../features/Worksheet/worksheetApi";
import { setItemList } from "../../features/Worksheet/worksheetSlice";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="right" ref={ref} {...props} timeout={{ enter: 400, exit: 400 }} />;
});

// Per-page options for user selection
const PER_PAGE_OPTIONS = [15, 30, 50];

function WorksheetList() {
  const user = JSON.parse(localStorage.getItem("userData"));
  const [open, setOpen] = useState(false);

  // Server-side pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filter states
  const [worksheetFilters, setWorksheetFilters] = useState({
    salesName: "",
    status: "",
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Debounced search keyword
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const searchTimeoutRef = useRef();

  // Server-side pagination API call
  const { data, error, isFetching, isSuccess, refetch, isLoading } = useGetAllWorksheetQuery(
    {
      page: currentPage,
      per_page: perPage,
      search: debouncedKeyword,
      status: worksheetFilters.status,
      sales_name: worksheetFilters.salesName,
      user_role: user?.role || "",
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: false,
      refetchOnReconnect: true,
    }
  );

  const dispatch = useDispatch();
  const tShirtImg = import.meta.env.VITE_IMAGE_T_SHIRT_CREATE;
  const poloShirtImg = import.meta.env.VITE_IMAGE_POLO_SHIRT_CREATE;

  const observer = useRef();
  const lastCardRef = useRef();

  // Get worksheet data from API response
  const worksheetData = useMemo(() => {
    return data?.data || [];
  }, [data]);

  // Update hasMore based on API pagination metadata
  useEffect(() => {
    if (data?.meta) {
      setHasMore(data.meta.current_page < data.meta.last_page);
    }
  }, [data]);

  // Debounce search keyword - wait 500ms after user stops typing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedKeyword(searchQuery);
      setCurrentPage(1); // Reset to first page on new search
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setLoadingMore(false);
    setIsInitialLoad(true);
  }, [debouncedKeyword, worksheetFilters, perPage]);

  // Update initial load state
  useEffect(() => {
    if (isSuccess && worksheetData.length > 0) {
      setIsInitialLoad(false);
      setLoadingMore(false);
    }
  }, [isSuccess, worksheetData.length]);

  // Update redux store when data changes
  useEffect(() => {
    if (isSuccess && data) {
      dispatch(setItemList(data));
    }
  }, [data, isSuccess, dispatch]);

  // Memoized render function for worksheet cards
  const renderWorksheetCards = useCallback(
    (worksheets) => {
      return (
        <Grid
          container
          spacing={3}
          marginTop={1}
          marginBottom={4}
          columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
        >
          {worksheets.map((item, index) => (
            <Grid
              key={`${item.worksheet_id || item.work_id || index}`}
              size={1}
              data-testid="worksheet-card"
            >
              <WorksheetCard data={item} isSuccess={isSuccess} />
            </Grid>
          ))}
        </Grid>
      );
    },
    [isSuccess]
  );

  // Optimized content rendering with skeleton loading
  const content = useMemo(() => {
    // Show skeleton on initial load
    if ((isLoading || isFetching) && isInitialLoad) {
      return <WorksheetListSkeleton count={perPage} />;
    }

    if (error) {
      return (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" color="error">
            Error loading worksheets: {error.message || "Unknown error"}
          </Typography>
          <Button variant="outlined" color="error" onClick={() => refetch()} sx={{ mt: 2 }}>
            Retry
          </Button>
        </Box>
      );
    }

    if (!worksheetData.length) {
      return (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            {keyword || worksheetFilters.salesName || worksheetFilters.status
              ? "No matching worksheets found."
              : "There is no worksheet data available."}
          </Typography>
        </Box>
      );
    }

    return renderWorksheetCards(worksheetData);
  }, [
    isLoading,
    isFetching,
    isInitialLoad,
    error,
    worksheetData,
    debouncedKeyword,
    worksheetFilters,
    perPage,
    renderWorksheetCards,
    refetch,
  ]);

  // Loading more indicator for infinite scroll
  const loadingMoreContent = useMemo(() => {
    if (loadingMore || (isFetching && !isInitialLoad)) {
      return (
        <Box sx={{ textAlign: "center", py: 2 }} ref={lastCardRef}>
          <CircularProgress color="error" size={40} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Loading more worksheets...
          </Typography>
        </Box>
      );
    }

    // Show the intersection observer target for triggering next load
    if (hasMore && !isInitialLoad) {
      return <Box ref={lastCardRef} sx={{ height: "20px", visibility: "hidden" }} />;
    }

    return null;
  }, [loadingMore, isFetching, isInitialLoad, hasMore]);

  const handleCreate = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  // Handle filter changes - Only for authorized roles
  const handleFilterChange = useCallback((newFilters) => {
    setWorksheetFilters(newFilters);
  }, []);

  // Handle per-page change
  const handlePerPageChange = useCallback((event) => {
    setPerPage(event.target.value);
  }, []);

  // Infinite scrolling - load next page from server
  useEffect(() => {
    const currentObserver = observer.current;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isFetching && !loadingMore && hasMore && !isInitialLoad) {
          setLoadingMore(true);
          setCurrentPage((prev) => prev + 1);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
      }
    );

    if (lastCardRef.current) {
      observer.current.observe(lastCardRef.current);
    }

    return () => {
      if (currentObserver) currentObserver.disconnect();
    };
  }, [isFetching, loadingMore, hasMore, isInitialLoad]);

  return (
    <div className="worksheet-list">
      <TitleBar title="worksheet" />

      {/* dialog create btn */}
      <div className="d-flex align-items-center justify-content-between">
        {user.role === "sale" || user.role === "admin" ? (
          <Button
            variant="contained"
            onClick={handleCreate}
            className="btn-create-dialog"
            sx={{ textTransform: "uppercase" }}
          >
            Create
          </Button>
        ) : null}
      </div>

      {/* Worksheet Filter Component - For admin and manager only */}
      {(user?.role === "admin" || user?.role === "manager") && (
        <Box paddingX={3} marginTop={3}>
          <WorksheetFilter
            data={data}
            onFilterChange={handleFilterChange}
            initialFilters={worksheetFilters}
          />
        </Box>
      )}

      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => setOpen((prev) => !prev)}
        className="dialog-btn-create"
      >
        <DialogContent>
          <DialogContentText id="alert-dialog-description" className="py-2">
            <Link to="/worksheet-create/t-shirt">
              <img src={tShirtImg} title="Create T-Shirt Worksheet" width={250} />
            </Link>
          </DialogContentText>
          <DialogContentText id="alert-dialog-description" className="py-2">
            <Link to="/worksheet-create/polo-shirt">
              <img
                className="img-polo"
                src={poloShirtImg}
                title="Create worksheet Polo Shirt"
                width={250}
              />
            </Link>
          </DialogContentText>
        </DialogContent>
      </Dialog>

      <Box paddingX={3} marginTop={1} maxWidth="xxl">
        {/* Per-page selector - positioned above cards, right-aligned */}
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 2, mb: 2 }}
        >
          {/* Show total count if available */}
          {data?.meta?.total && (
            <Typography variant="body2" color="text.secondary">
              ทั้งหมด {data.meta.total} รายการ
            </Typography>
          )}

          <FormControl size="small" variant="outlined">
            {/* <InputLabel htmlFor="search-worksheet">Search</InputLabel> */}
            <TextField
              id="search-worksheet"
              label="ค้นหา"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ minWidth: 200, backgroundColor: "white" }}
            />
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>แสดง</InputLabel>
            <Select value={perPage} label="แสดง" onChange={handlePerPageChange}>
              {PER_PAGE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option} รายการ
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {content}
        {loadingMoreContent}
      </Box>
    </div>
  );
}

export default WorksheetList;
