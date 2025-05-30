export const apiConfig = {
    baseUrl: import.meta.env.VITE_END_POINT_URL,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      headers.set("Accept", "application/json");

      // ดึง Token จาก localStorage (หรือ sessionStorage ตามที่คุณบันทึกไว้)
      const token = localStorage.getItem("authToken"); // หรือ sessionStorage.getItem("authToken");

      // ถ้ามี Token ให้นำไปใส่ใน Authorization Header แบบ Bearer Token
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
    credentials: "include",
  };
  