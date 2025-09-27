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
  Pagination,
  Skeleton,
} from "@mui/material";
import { useState, forwardRef, useEffect, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";

import WorksheetCard from "./WorksheetCard";
import WorksheetFilter from "./WorksheetFilter";
import WorksheetListSkeleton from "./WorksheetListSkeleton";
import "./Worksheet.css";
import TitleBar from "../../components/TitleBar";
import {
  useGetAllWorksheetQuery,
  // useGetMoreWorksheetQuery,
} from "../../features/Worksheet/worksheetApi";
import { setItemList } from "../../features/Worksheet/worksheetSlice";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="right" ref={ref} {...props} timeout={{ enter: 400, exit: 400 }} />;
});

function WorksheetList() {
  const user = JSON.parse(localStorage.getItem("userData"));
  const [open, setOpen] = useState(false);
  const [cardLimit, setCardLimit] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filteredDataCache, setFilteredDataCache] = useState([]);
  const [worksheetFilters, setWorksheetFilters] = useState({
    salesName: "",
    status: "",
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const keyword = useSelector((state) => state.global.keyword);

  // Optimized API query with better caching strategy
  const { data, error, isFetching, isSuccess, refetch, isLoading } = useGetAllWorksheetQuery(
    undefined,
    {
      // Enable caching for 5 minutes to reduce API calls
      pollingInterval: 0,
      refetchOnMountOrArgChange: 300000, // 5 minutes
      refetchOnFocus: false,
      refetchOnReconnect: true,
      // Keep previous data while fetching new data
      keepPreviousData: true,
    }
  );

  const dispatch = useDispatch();
  const tShirtImg = import.meta.env.VITE_IMAGE_T_SHIRT_CREATE;
  const poloShirtImg = import.meta.env.VITE_IMAGE_POLO_SHIRT_CREATE;

  const observer = useRef();
  const lastCardRef = useRef();
  const searchTimeoutRef = useRef();

  // Optimized debounced search function with longer delay to reduce API calls
  const debouncedRefetch = useCallback(
    (searchTerm) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        // Only refetch if search term is significantly different or empty
        if (searchTerm.length === 0 || searchTerm.length >= 2) {
          refetch();
        }
      }, 500); // Increased to 500ms for better performance
    },
    [refetch]
  );

  // Memoized render function for worksheet cards
  const renderWorksheetCards = useCallback(
    (data, isSuccess) => {
      return (
        <Grid
          container
          spacing={3}
          marginTop={1}
          marginBottom={4}
          columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
        >
          {data.slice(0, cardLimit).map((item, index) => (
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
    [cardLimit]
  );

  // Optimized content rendering with skeleton loading
  const content = useMemo(() => {
    // Show skeleton on initial load or when switching between major filter changes
    if ((isLoading || isFetching) && isInitialLoad) {
      return <WorksheetListSkeleton count={cardLimit} />;
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

    if (!filteredDataCache.length) {
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

    return renderWorksheetCards(filteredDataCache, isSuccess);
  }, [
    isLoading,
    isFetching,
    isInitialLoad,
    error,
    filteredDataCache,
    keyword,
    worksheetFilters,
    cardLimit,
    renderWorksheetCards,
    isSuccess,
    refetch,
  ]);

  // Optimized loading more indicator
  const loadingMoreContent = useMemo(() => {
    // Only show loading more if:
    // 1. There are more items in filteredDataCache than currently displayed (cardLimit)
    // 2. Not in initial load state
    // 3. Currently loading more data
    const hasMoreData = filteredDataCache.length > cardLimit;
    const isShowingPartialData = cardLimit < filteredDataCache.length;

    if (hasMoreData && isShowingPartialData && !isInitialLoad && loadingMore) {
      return (
        <Box sx={{ textAlign: "center", py: 2 }} ref={lastCardRef}>
          <CircularProgress color="error" size={40} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Loading more worksheets...
          </Typography>
        </Box>
      );
    }

    // Show the intersection observer target even when not loading (for triggering next load)
    if (hasMoreData && isShowingPartialData && !isInitialLoad && !loadingMore) {
      return <Box ref={lastCardRef} sx={{ height: "20px", visibility: "hidden" }} />;
    }

    return null;
  }, [filteredDataCache.length, cardLimit, isInitialLoad, loadingMore]);

  const handleCreate = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Update redux store when data changes
  useEffect(() => {
    if (isSuccess) {
      dispatch(setItemList(data));
    }
  }, [data, isSuccess, dispatch]);

  // Handle filter changes - Only for authorized roles
  const handleFilterChange = useCallback(
    (newFilters) => {
      // Check if user has permission to use filters
      if (user.role === "manager" || user.role === "admin") {
        setWorksheetFilters(newFilters);
        setCardLimit(10); // Reset card limit when filters change
        setLoadingMore(false); // Reset loading more state
      }
    },
    [user.role]
  );

  // Handle keyword changes
  useEffect(() => {
    // Trigger refetch when keyword changes
    debouncedRefetch(keyword);

    // Reset card limit and loading state when search changes to show fresh results
    setCardLimit(10);
    setLoadingMore(false);
  }, [keyword, debouncedRefetch]);

  // Memoized filtered data for better performance
  const filteredData = useMemo(() => {
    if (!isSuccess || !data?.data) return [];

    const isManager = user.role === "manager";

    return data.data.filter((item) => {
      // Role-based filtering
      const isRelevantStatus = [2, 3, 4, 5, 6].includes(item.status.code);
      const passesRoleFilter = (isManager && isRelevantStatus) || !isManager;

      if (!passesRoleFilter) return false;

      // Keyword search filtering
      if (keyword !== "") {
        const searchKeyword = keyword.toLowerCase();
        const searchWorkID = (item.work_id || "").toLowerCase().includes(searchKeyword);
        const searchWorkName = (item.work_name || "").toLowerCase().includes(searchKeyword);
        const searchUserName = (item.sales_name || "").toLowerCase().includes(searchKeyword);
        const searchCusName = (item.cus_name || "").toLowerCase().includes(searchKeyword);

        const passesKeywordFilter =
          searchWorkID || searchWorkName || searchUserName || searchCusName;
        if (!passesKeywordFilter) return false;
      }

      // Additional filters - Only apply if user has permission
      if (user.role === "manager" || user.role === "admin") {
        if (worksheetFilters.salesName !== "" && item.sales_name !== worksheetFilters.salesName) {
          return false;
        }

        if (worksheetFilters.status !== "" && item.status.title !== worksheetFilters.status) {
          return false;
        }
      }

      return true;
    });
  }, [data, keyword, worksheetFilters, user.role, isSuccess]);

  // Update cached data when filtered data changes
  useEffect(() => {
    setFilteredDataCache(filteredData);
    setLoadingMore(false); // Reset loading state when data changes
    if (isInitialLoad && filteredData.length > 0) {
      setIsInitialLoad(false);
    }
  }, [filteredData, isInitialLoad]);

  // Optimized infinite scrolling setup
  useEffect(() => {
    const currentObserver = observer.current;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loadingMore && !isInitialLoad) {
          // Check if there's actually more data to load
          const hasMoreData = filteredDataCache.length > cardLimit;

          if (hasMoreData) {
            setLoadingMore(true);
            // Use requestAnimationFrame for better performance
            requestAnimationFrame(() => {
              setTimeout(() => {
                setCardLimit((prev) => Math.min(prev + 10, filteredDataCache.length));
                setLoadingMore(false);
              }, 100); // Reduced delay for faster loading
            });
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px", // Start loading before element is fully visible
      }
    );

    if (lastCardRef.current) {
      observer.current.observe(lastCardRef.current);
    }

    return () => {
      if (currentObserver) currentObserver.disconnect();
    };
  }, [loadingMore, isInitialLoad, filteredDataCache.length, cardLimit]);

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

      {/* Worksheet Filter Component - Only for Manager and Admin */}
      {(user.role === "manager" || user.role === "admin") && (
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
        {content}
        {loadingMoreContent}
      </Box>
    </div>
  );
}

export default WorksheetList;
