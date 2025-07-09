import { useState, forwardRef, useEffect, useRef } from "react";
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
  Grid2 as Grid,
  Slide,
  Toolbar,
  Typography,
  Pagination,
} from "@mui/material";
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
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const keyword = useSelector((state) => state.global.keyword);
  
  // Force refetch when keyword changes
  const { data, error, isFetching, isSuccess, refetch } = useGetAllWorksheetQuery({ search: keyword, page }, {
    refetchOnMountOrArgChange: true,
  });
  
  const dispatch = useDispatch();
  const tShirtImg = import.meta.env.VITE_IMAGE_T_SHIRT_CREATE;
  const poloShirtImg = import.meta.env.VITE_IMAGE_POLO_SHIRT_CREATE;

  const observer = useRef();
  const lastCardRef = useRef();

  const renderWorksheetCards = (data, isSuccess) => {
    return data.map((item, index) => {
      return (
        <Grid key={`${item.worksheet_id || item.work_id || index}`} size={1} data-testid="worksheet-card">
          <WorksheetCard data={item} isSuccess={isSuccess} />
        </Grid>
      );
    });
  };

  let content;

  if (isFetching && !items.length) {
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
  } else if (!items.length) {
    // No data available or no matching search results
    content = (
      <h1 className="text-center" style={{ width: "100%" }}>
        {keyword ? 'No matching worksheets found.' : 'There is no worksheet data available.'}
      </h1>
    );
  } else {
    // Render the filtered data from cache
    content = renderWorksheetCards(items, isSuccess);
  }
  const loadinContentgMore = hasMore && (
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
    setPage(1);
    setItems([]);
    setHasMore(true);
  }, [keyword]);
  
  // Update items when data changes
  useEffect(() => {
    if (isSuccess && data?.data) {
      const isManager = user.role === 'manager';

      const filtered = data.data.filter((item) => {
        const isRelevantStatus = [2, 3, 4, 5, 6].includes(item.status.code);
        return (isManager && isRelevantStatus) || !isManager;
      });

      setItems((prev) => (page === 1 ? filtered : [...prev, ...filtered]));
      setHasMore(data.pagination ? page < data.pagination.total_pages : false);
    }
  }, [data, isSuccess, user.role, page]);

  // Infinite scrolling setup
  useEffect(() => {
    const currentObserver = observer.current;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isFetching) {
        setPage((prev) => prev + 1);
      }
    });

    if (lastCardRef.current) observer.current.observe(lastCardRef.current);

    return () => {
      if (currentObserver) currentObserver.disconnect();
    };

  }, [isFetching, hasMore]);

  return (
    <div className="worksheet-list">
      <TitleBar title="worksheet" />
      
      {/* dialog create btn */}
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
