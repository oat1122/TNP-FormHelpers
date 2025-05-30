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
  const [cardLimit, setCardLimit] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const { data, error, isFetching, isSuccess } = useGetAllWorksheetQuery();
  const dispatch = useDispatch();
  const tShirtImg = import.meta.env.VITE_IMAGE_T_SHIRT_CREATE;
  const poloShirtImg = import.meta.env.VITE_IMAGE_POLO_SHIRT_CREATE;
  const keyword = useSelector((state) => state.global.keyword);

  const observer = useRef();
  const lastCardRef = useRef();

  const renderWorksheetCards = (data, isSuccess) => {
    const isManager = user.role === 'manager';
  
    return data.slice(0, cardLimit).map((item, index) => {
      const isRelevantStatus = [2, 3, 4, 5, 6].includes(item.status.code);
  
      // Check if the item should be rendered based on user role and status
      if ((isManager && isRelevantStatus) || !isManager) {
        return (
          <Grid key={index} size={1} data-testid="worksheet-card">
            <WorksheetCard data={item} isSuccess={isSuccess} />
          </Grid>
        );
      }
  
      // Return null if the item doesn't meet the conditions
      return null;
    });
  };

  let content;

  if (isFetching) {
    content = (
      <div className="w-100 text-center mt-4">
        <CircularProgress color="error" size={60} />
      </div>
    );

  } else if (data.data.length === 0) {
    content = (
      <h1 className="text-center" style={{ width: "100%" }}>
        There is no worksheet data available.
      </h1>
    );

  } else if (error) {
    content = (
      <h2 className="text-center" style={{ width: "100%" }}>
        Error loading worksheets.
      </h2>
    );

  } else {
   
    const filteredData = data.data.filter((item) => {
      const isManager = user.role === 'manager';
      const isRelevantStatus = [2, 3, 4, 5, 6].includes(item.status.code);
      
      return (isManager && isRelevantStatus) || !isManager;
    })
    .filter((item) => {

      if (keyword !== '') {
        const searchWorkID = (item.work_id).toLowerCase().includes(keyword.toLowerCase()); 
        const searchWorkName = (item.work_name).toLowerCase().includes(keyword.toLowerCase()); 
        const searchUserName = (item.sales_name).toLowerCase().includes(keyword.toLowerCase()); 
        const searchCusName = (item.cus_name).toLowerCase().includes(keyword.toLowerCase()); 

        return searchWorkID || searchWorkName || searchUserName || searchCusName;

      } else {

        return item;
      }
    });
  
    if (filteredData.length === 0) {
      content = (
        <h1 className="text-center" style={{ width: "100%" }}>
          There is no worksheet data available.
        </h1>
      );
    } else {
      content = renderWorksheetCards(filteredData, isSuccess);
    }
  }

  const loadinContentgMore = data && data.data.length > cardLimit && (
    <div className="w-100 text-center mt-4" ref={lastCardRef}>
      <CircularProgress color="error" size={60} />
    </div>
  )
  
  const handleCreate = () => {
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    if (isSuccess) {
      dispatch(setItemList(data));
    }
  }, [data]);

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
