// Server health check utility
export const checkServerHealth = async () => {
  try {
    const response = await fetch("http://localhost:8000/api/health", {
      method: "GET",
      timeout: 5000,
    });

    if (response.ok) {
      return { isHealthy: true, message: "Server is running" };
    } else {
      return { isHealthy: false, message: "Server responded with error" };
    }
  } catch (error) {
    return {
      isHealthy: false,
      message: "Cannot connect to server",
      error: error.message,
    };
  }
};

// Instructions for starting Laravel server
export const getServerInstructions = () => ({
  title: "วิธีเปิด Laravel Server",
  steps: [
    "เปิด Terminal/Command Prompt",
    "ไปที่โฟลเดอร์ tnp-backend",
    "รันคำสั่ง: php artisan serve",
    "ตรวจสอบว่า server ทำงานที่ http://localhost:8000",
    'กลับมาที่หน้าเว็บและคลิก "เชื่อมต่อ Backend"',
  ],
  commands: ["cd tnp-backend", "php artisan serve"],
  troubleshooting: [
    "ตรวจสอบว่าติดตั้ง PHP แล้วหรือไม่",
    "ตรวจสอบว่าติดตั้ง Composer แล้วหรือไม่",
    "ลองรันคำสั่ง: composer install",
    "ตรวจสอบว่าไฟล์ .env มีอยู่หรือไม่",
  ],
});
