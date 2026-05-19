import { Alert } from "@mui/material";

/**
 * Alert ด้านบนที่บอกแหล่งที่มาของ delivery note —
 *  - source + invoice_item_id  → "รายการที่เลือก..."
 *  - source + invoice          → "ใบแจ้งหนี้ที่เลือก..."
 *  - ไม่มี source              → warning manual mode
 */
const SourceAlert = ({ source }) => {
  if (!source) {
    return (
      <Alert severity="warning">ไม่ได้เลือกใบแจ้งหนี้ คุณสามารถสร้างใบส่งของแบบ manual ได้</Alert>
    );
  }
  if (source.invoice_item_id) {
    return (
      <Alert severity="info">
        รายการที่เลือก: <strong>{source.item_name}</strong> จากใบแจ้งหนี้{" "}
        <strong>{source.invoice_number}</strong>
      </Alert>
    );
  }
  return (
    <Alert severity="info">
      ใบแจ้งหนี้ที่เลือก: <strong>{source.invoice_number}</strong>
    </Alert>
  );
};

export default SourceAlert;
