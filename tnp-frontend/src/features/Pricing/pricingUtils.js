import moment from "moment";

// แปลงค่าวันที่ recall ให้อยู่ในรูปแบบแสดงจำนวนวันที่เหลือจนถึงวันที่ต้องติดต่อ หรือจำนวนวันที่เกินกำหนดแล้ว
export function formatCustomRelativeTime(dateString) {
  if (!dateString) {
    return 0;
  }

  const recallDate = moment(dateString).startOf("day");
  const today = moment().startOf("day");

  // คำนวณจำนวนวันระหว่าง recall date กับวันนี้
  const diffInDays = recallDate.diff(today, "days");

  // ถ้า recall date เป็นในอนาคต = ยังไม่ถึงเวลาต้องติดต่อ
  if (diffInDays > 0) {
    return diffInDays; // จำนวนวันที่เหลือ
  }

  // ถ้า recall date เป็นวันนี้หรือผ่านมาแล้ว = ถึงเวลาต้องติดต่อแล้ว
  return Math.abs(diffInDays); // จำนวนวันที่เกินกำหนด (0 สำหรับวันนี้)
}

export function genCustomerNo(lastCustomerNumber = null) {
  const currentYear = moment().year().toString();

  let nextId;
  if (lastCustomerNumber) {
    const lastYear = lastCustomerNumber.substring(0, 4);
    const lastId = parseInt(lastCustomerNumber.substring(4), 10);

    nextId = lastYear === currentYear ? lastId + 1 : 1;
  } else {
    nextId = 1;
  }

  return `${currentYear}${nextId.toString().padStart(6, "0")}`;
}

export function validateValue(props) {
  let result = "";

  if (!props.formData.pr_cus_id) {
    result = "กรุณาเลือกข้อมูลลูกค้า";
  }

  return result;
}
