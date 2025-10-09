// ตัวอย่างการใช้งาน AdvancedFilter แบบใหม่
// ใช้ API ที่ปรับปรุงแล้วจากการออกแบบใหม่

import React from "react";
import { AdvancedFilter, useAdvancedFilter } from "../shared/components";

const CustomFilterExample = () => {
  // กำหนด status options ที่แตกต่างกัน
  const customStatusOptions = [
    { value: "active", label: "ใช้งาน" },
    { value: "inactive", label: "ไม่ใช้งาน" },
    { value: "pending", label: "รอดำเนินการ" },
  ];

  // ใช้ hook แบบใหม่
  const { filters, handlers, getQueryArgs } = useAdvancedFilter();

  // Custom refresh function
  const handleCustomRefresh = () => {
    console.log("Refresh triggered with filters:", filters);
    console.log("Query args:", getQueryArgs());
    // ทำอะไรก็ได้เมื่อ refresh
    // เช่น เรียก API, update state, etc.
  };

  return (
    <div>
      <h2>ตัวอย่างการใช้งาน AdvancedFilter (API ใหม่)</h2>
      
      <AdvancedFilter
        filters={filters}
        handlers={handlers}
        onRefresh={handleCustomRefresh}
        statusOptions={customStatusOptions}
      />

      {/* แสดงผล filters ปัจจุบัน */}
      <div style={{ marginTop: 20 }}>
        <h3>Filter State ปัจจุบัน:</h3>
        <pre>{JSON.stringify(filters, null, 2)}</pre>
        
        <h3>Query Args สำหรับ API:</h3>
        <pre>{JSON.stringify(getQueryArgs(), null, 2)}</pre>
        
        <h3>Handlers Available:</h3>
        <ul>
          <li>handleSearchChange</li>
          <li>handleStatusChange</li>
          <li>handleDateRangeChange</li>
          <li>resetFilters</li>
        </ul>
      </div>
    </div>
  );
};

export default CustomFilterExample;