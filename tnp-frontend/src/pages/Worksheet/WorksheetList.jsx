import { useState, forwardRef, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import WorksheetCard from "./WorksheetCard";
import { 
  AppBar, 
  Box,
  Button,
  Dialog, 
  DialogContent, 
  DialogContentText, 
  Container,
  CircularProgress, 
  Slide,
  Toolbar,
  Typography,
  Pagination,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import "./Worksheet.css";
import {
  useGetAllWorksheetQuery,
  // useGetMoreWorksheetQuery,
} from "../../features/Worksheet/worksheetApi";
import { setItemList } from "../../features/Worksheet/worksheetSlice";
import { Link, useParams } from "react-router-dom";
import TitleBar from "../../components/TitleBar";

const Transition = forwardRef(function Transition(props, ref) {
  return (
    <Slide
      direction="right"
      ref={ref}
      {...props}
      timeout={{ enter: 400, exit: 400 }}
    />
  );
});

function WorksheetList() {
  const user = JSON.parse(localStorage.getItem("userData"));
  const [open, setOpen] = useState(false);
  const [cardLimit, setCardLimit] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filteredDataCache, setFilteredDataCache] = useState([]);
  const keyword = useSelector((state) => state.global.keyword);
  
  // Force refetch when keyword changes
  const { data, error, isFetching, isSuccess, refetch } = useGetAllWorksheetQuery(undefined, {
    // The refetchOnMountOrArgChange ensures data is fresh
    refetchOnMountOrArgChange: true
  });
  
  const dispatch = useDispatch();
  const tShirtImg = import.meta.env.VITE_IMAGE_T_SHIRT_CREATE;
  const poloShirtImg = import.meta.env.VITE_IMAGE_POLO_SHIRT_CREATE;

  const observer = useRef();
  const lastCardRef = useRef();
  
  // Debounced search function
  const debouncedRefetch = useCallback(
    (() => {
      let timer;
      return (searchTerm) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          refetch();
        }, 300); // 300ms delay
      };
    })(),
    [refetch]
  );

  const renderWorksheetCards = (data, isSuccess) => {
    return data.slice(0, cardLimit).map((item, index) => {
      return (
        <Grid key={`${item.worksheet_id || item.work_id || index}`} size={1} data-testid="worksheet-card">
          <WorksheetCard data={item} isSuccess={isSuccess} />
        </Grid>
      );
    });
  };

  let content;

  if (isFetching && !filteredDataCache.length) {
    content = (
      <div className="w-100 text-center mt-4">
        <CircularProgress color="error" size={60} />
      </div>
    );
  } else if (error) {
    content = (
      <h2 className="text-center" style={{ width: "100%" }}>
        Error loading worksheets: {error.message || 'Unknown error'}
      </h2>
    );
  } else if (!filteredDataCache.length) {
    // No data available or no matching search results
    content = (
      <h1 className="text-center" style={{ width: "100%" }}>
        {keyword ? 'No matching worksheets found.' : 'There is no worksheet data available.'}
      </h1>
    );
  } else {
    // Render the filtered data from cache
    content = renderWorksheetCards(filteredDataCache, isSuccess);
  }

  const loadinContentgMore = filteredDataCache.length > cardLimit && (
    <div className="w-100 text-center mt-4" ref={lastCardRef}>
      <CircularProgress color="error" size={60} />
    </div>
  )
  
  const handleCreate = () => {
    setOpen((prev) => !prev);
  };

  // Update redux store when data changes
  useEffect(() => {
    if (isSuccess) {
      dispatch(setItemList(data));
    }
  }, [data, isSuccess, dispatch]);

  // Handle keyword changes
  useEffect(() => {
    // Trigger refetch when keyword changes
    debouncedRefetch(keyword);
    
    // Reset card limit when search changes to show fresh results
    setCardLimit(10);
  }, [keyword, debouncedRefetch]);
  
  // Filter data when data or keyword changes
  useEffect(() => {
    if (isSuccess && data?.data) {
      const isManager = user.role === 'manager';
      
      const filtered = data.data.filter((item) => {
        const isRelevantStatus = [2, 3, 4, 5, 6].includes(item.status.code);
        const passesRoleFilter = (isManager && isRelevantStatus) || !isManager;
        
        if (!passesRoleFilter) return false;
        
        if (keyword !== '') {
          const searchWorkID = (item.work_id || '').toLowerCase().includes(keyword.toLowerCase()); 
          const searchWorkName = (item.work_name || '').toLowerCase().includes(keyword.toLowerCase()); 
          const searchUserName = (item.sales_name || '').toLowerCase().includes(keyword.toLowerCase()); 
          const searchCusName = (item.cus_name || '').toLowerCase().includes(keyword.toLowerCase()); 
  
          return searchWorkID || searchWorkName || searchUserName || searchCusName;
        }
        
        return true;
      });
      
      setFilteredDataCache(filtered);
    }
  }, [data, keyword, user.role, isSuccess]);

  // Infinite scrolling setup
  useEffect(() => {
    const currentObserver = observer.current;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMore) {
        setLoadingMore(true);
        setTimeout(() => {
          setCardLimit((prev) => prev + 10);
          setLoadingMore(false);
        }, 200);
      }
    });
    if (lastCardRef.current) observer.current.observe(lastCardRef.current);

    return () => {
      if (currentObserver) currentObserver.disconnect();
    };

  }, [isFetching, loadingMore]);

  return (
    <div className="worksheet-list">
      <TitleBar title="worksheet" />
      
      {/* dialog create btn */}
      <div className="d-flex align-items-center justify-content-between">
        { user.role === 'sale' || user.role === 'admin' ? (
          <Button
            variant="contained"
            onClick={handleCreate}
            className="btn-create-dialog"
            sx={{ textTransform: "uppercase" }}
          >
            Create
          </Button>
        ) : null}
        
        <Button
          variant="outlined"
          onClick={() => refetch()}
          className="ms-2"
          color="error"
          size="small"
          sx={{ 
            position: 'absolute',
            right: '20px',
            top: '80px',
            textTransform: "capitalize"
          }}
        >
          {isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
      
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
              <img
                src={tShirtImg}
                title="Create T-Shirt Worksheet"
                width={250}
              />
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

      <Box paddingX={3} marginTop={3} maxWidth="xxl">
        <Grid container spacing={3} marginTop={1} marginBottom={4} columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5, }}>
          {content}
          {loadinContentgMore}
        </Grid>
      </Box>
    </div>
  );
}

export default WorksheetList;
