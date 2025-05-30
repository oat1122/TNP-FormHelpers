import React, { useState } from "react";
import {
  Box,
  Chip,
  Paper,
  styled,
  Button,
  Dialog,
  DialogActions,
  Grid2 as Grid,
  Autocomplete,
  TextField,
  OutlinedInput,
  Divider,
  IconButton,
  Typography,
  Select,
  MenuItem,
  Card,
  CardMedia,
  TextareaAutosize,
} from "@mui/material";
import { PiClockClockwise } from "react-icons/pi";
import { CgTimelapse } from "react-icons/cg";
import { IoSearch } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { setErrorMsg } from "../features/Worksheet/worksheetSlice";
import DataTable from "./DataTable";

const StyledOutlinedInput = styled(OutlinedInput)(({ theme }) => ({
  backgroundColor: theme.vars.palette.grey.outlinedInput,

  "& fieldset": {
    borderColor: theme.vars.palette.grey.outlinedInput,
  },

  "&.Mui-disabled": {
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.vars.palette.grey.outlinedInput,
    },

    "& .MuiOutlinedInput-input": {
      WebkitTextFillColor: theme.vars.palette.text.primary,
    },
  },
}));

function Testing() {
  // const dispatch = useDispatch();
  // const [open, setOpen] = useState(false);
  // const [value, setValue] = useState("");
  // const errorMsg = useSelector((state) => state.worksheet.errorMsg);

  const [dataSearch, setDataSearch] = useState({
    limit: 10,
    offset: 0,
    filter: null,
    sort: null
  });

   // ข้อมูลตัวอย่าง
  const [data, setData] = useState([
    { id: 1, jobId: 'JOB-001', customer: 'บริษัท A', status: 'รับคิวงาน', amount: 5000 },
    { id: 2, jobId: 'JOB-002', customer: 'บริษัท B', status: 'กำลังขนส่ง', amount: 7500 },
    { id: 3, jobId: 'JOB-003', customer: 'บริษัท C', status: 'เสร็จสิ้น', amount: 12000 },
    // ...เพิ่มข้อมูลตามต้องการ
  ]);

  const [totalCount, setTotalCount] = useState(3);

   // คอลัมน์ตัวอย่าง
  const columns = [
    { 
      field: 'jobId', 
      headerName: 'Job ID', 
      width: 150,
      filterable: true
    },
    { 
      field: 'customer', 
      headerName: 'ลูกค้า', 
      width: 200,
      filterable: true
    },
    { 
      field: 'status', 
      headerName: 'สถานะ', 
      width: 180,
      // renderCell: (params) => (
      //   // <span style={{ color: CheckColorStatus(params.value) }}>
      //     {params}
      //   // </span>
      // )
    },
    { 
      field: 'amount', 
      headerName: 'จำนวนเงิน', 
      width: 150,
      type: 'number',
      // valueFormatter: (params) => `${params.value.toLocaleString()} บาท`
    },
  ];

  // ข้อมูลสถานะงาน (ถ้ามี)
  const dataStatusJobs = [
    { status_name: 'รับคิวงาน', status_count: 5 },
    { status_name: 'กำลังขนส่ง', status_count: 3 },
    { status_name: 'เสร็จสิ้น', status_count: 12 },
  ];

  // ฟังก์ชันตัวอย่างสำหรับการ export
  const handleExport = () => {
    console.log('Exporting data...');
    // เรียก API สำหรับ export ข้อมูล
  };

  // ฟังก์ชันตัวอย่างสำหรับการ import
  const handleImport = () => {
    console.log('Importing data...');
    // เรียก API สำหรับ import ข้อมูล
  };

  return (
    <>
      <Box sx={{ padding: 3, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
        <DataTable
          data={data}
          columns={columns}
          dataSearch={dataSearch}
          setDataSearch={setDataSearch}
          totalCount={totalCount}
          textToTotalCount="ทั้งหมด"
          isShowPageLimit={true}
          ShowJobsReport={true}
          dataStatusJobs={dataStatusJobs}
          showExpenseButtom={true}
          callbackexportescr={handleExport}
          callbackimport={handleImport}
          scroll={true}
        />
      </Box>
    </>
  );
}

export default Testing;
