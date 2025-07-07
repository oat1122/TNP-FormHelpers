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


export function validateValue(props) {
  let result = "";

  if (!props.formData.pr_cus_id) {

    result = "กรุณาเลือกข้อมูลลูกค้า";
  }

  return result;
}
