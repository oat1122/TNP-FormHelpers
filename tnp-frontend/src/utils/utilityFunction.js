// แปลงไฟล์เป็น Base64 สำหรับส่งผ่าน api แบบ json
export function fileToBase64(file) { 
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
}