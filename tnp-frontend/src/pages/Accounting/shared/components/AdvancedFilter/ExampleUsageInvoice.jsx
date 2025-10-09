import React from "react";
import { AdvancedFilter, useAdvancedFilter } from "./";

/**
 * ตัวอย่างการใช้งาน AdvancedFilter สำหรับหน้า Invoice
 * พร้อมกับ status_before และ status_after filters
 */
const ExampleUsageInvoice = () => {
  // กำหนด status options ต่างๆ
  const statusOptions = [
    { value: "draft", label: "แบบร่าง" },
    { value: "approved", label: "อนุมัติแล้ว" },
    { value: "pending", label: "รอดำเนินการ" },
    { value: "cancelled", label: "ยกเลิก" },
  ];

  const statusBeforeOptions = [
    { value: "draft", label: "แบบร่าง (ก่อนมัดจำ)" },
    { value: "approved", label: "อนุมัติแล้ว (ก่อนมัดจำ)" },
  ];

  const statusAfterOptions = [
    { value: "draft", label: "แบบร่าง (หลังมัดจำ)" },
    { value: "approved", label: "อนุมัติแล้ว (หลังมัดจำ)" },
  ];

  // ใช้ hook
  const { filters, handlers, getQueryArgs } = useAdvancedFilter();

  // จำลองการ refresh data
  const handleRefresh = () => {
    const queryArgs = getQueryArgs();
    console.log("Query arguments:", queryArgs);
    
    // ตัวอย่างการใช้งาน query args กับ API
    // fetch(`/api/invoices?${new URLSearchParams(queryArgs)}`);
  };

  return (
    <div>
      <h2>ตัวอย่างการใช้งาน AdvancedFilter สำหรับ Invoice</h2>
      
      <AdvancedFilter
        filters={filters}
        handlers={handlers}
        onRefresh={handleRefresh}
        statusOptions={statusOptions}
        statusBeforeOptions={statusBeforeOptions}
        statusAfterOptions={statusAfterOptions}
      />
      
      {/* แสดงค่าที่ filter ปัจจุบัน */}
      <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f5f5f5" }}>
        <h3>Current Filter Values:</h3>
        <pre>{JSON.stringify(filters, null, 2)}</pre>
        
        <h3>Query Arguments:</h3>
        <pre>{JSON.stringify(getQueryArgs(), null, 2)}</pre>
      </div>
    </div>
  );
};

export default ExampleUsageInvoice;