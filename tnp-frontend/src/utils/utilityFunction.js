import moment from "moment";

// แปลงไฟล์เป็น Base64 สำหรับส่งผ่าน api แบบ json
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
}

// Generate customer number in the format YYYY######
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
