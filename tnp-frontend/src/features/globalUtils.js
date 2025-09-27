import moment from "moment";
import axios from "../api/axios";
import { open_dialog_warning } from "../utils/dialog_swal2/alart_one_line";

const getCsrfToken = async () => {
  await axios.get(`/sanctum/csrf-cookie`);
};

export async function handlelogout() {
  try {
    // await getCsrfToken();
    const res = await axios.post("/logout");

    if (res.data.status === "success") {
      localStorage.clear();
      window.location.href = "/login";
    }
  } catch (e) {
    localStorage.clear();
    window.location.href = "/login";
    console.error("Logout failed: ", e.response?.data);
  }
}

// เช็คค่าที่จำเป็นต่อการใช้งาน ที่ส่งมาจากหลังบ้าน
export async function handleCheckUpdate(userData) {
  const authToken = localStorage.getItem("authToken");

  // if (!userData.user_nickname) {
  if (!authToken) {
    const res = await open_dialog_warning("มีการอัพเดตฟีเจอร์ใหม่ กรุณาลงชื่อเข้าใช้ใหม่อีกครั้ง");

    if (res) {
      handlelogout();
    }
  }
}

// ตรวจสอบ Session หมดอายุ - ปิดการใช้งานเพื่อป้องกันการ refresh หน้าซ้ำๆ
export async function handleCheckSessionExpires() {
  // Token expiry checking disabled to prevent infinite refresh loops
  console.log("Session expiry check disabled");
  return;

  /* Original code commented out to prevent token expiry issues
  const tokenExpiry = localStorage.getItem('tokenExpiry');

  const now = new Date().getTime();
  const expiresAt = parseInt(tokenExpiry);

  console.log('tokenExpiry :', tokenExpiry)
  console.log('now :', now)
  console.log('expiresAt :', expiresAt)
    

  if (!tokenExpiry || (now > expiresAt)) {
    // await showSessionExpiredWarning();
    const res = await open_dialog_warning('Session ของคุณหมดอายุแล้ว กรุณาลงชื่อเข้าใช้ใหม่');

    if (res) {
      handlelogout();
    }
  }
  */
}
