import moment from "moment";

// แปลงค่าวันที่ตามลูกค้า ให้อยู่ในรูปแบบนับเวลาถอยหลัง
export function formatCustomRelativeTime(dateString) {
  const endOfDay = moment(dateString).endOf('day');
  const now = moment();
  const diffInDays = endOfDay.diff(now, 'days');

  if (diffInDays >= 0) { // Check for future dates
    return diffInDays; // Customize the format for future
  } else {
    return "0"; // Customize for past
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
