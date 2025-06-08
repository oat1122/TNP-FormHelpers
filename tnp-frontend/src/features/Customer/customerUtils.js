import moment from "moment";

// แปลงค่าวันที่ตามลูกค้า ให้อยู่ในรูปแบบนับเวลาถอยหลัง (จำนวนวันที่ขาดการติดต่อ)
export function formatCustomRelativeTime(dateString) {
  if (!dateString) {
    return 0;
  }
  
  try {
    const lastContactDate = moment(dateString);
    const now = moment();
    
    // คำนวณจำนวนวันที่ผ่านไปตั้งแต่การติดต่อครั้งสุดท้าย
    const diffInDays = now.diff(lastContactDate, 'days');
    
    // คืนค่าจำนวนวันที่ขาดการติดต่อ (ต้องเป็นค่าบวก)
    return Math.max(0, diffInDays);
  } catch (error) {
    console.warn('Error calculating recall days for date:', dateString, error);
    return 0;
  }
}

export function genCustomerNo(lastCustomerNumber = null)
{
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
};
