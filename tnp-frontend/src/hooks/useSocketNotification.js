import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

// URL ของ Notification Server - ใช้ค่าจาก .env
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

/**
 * Custom hook for real-time Socket.io notifications
 * Connects to Fastify Notification Server and displays toast on new notifications
 */
export const useSocketNotification = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    // ดึง user data จาก localStorage
    const userData = localStorage.getItem("userData");
    if (!userData) return;

    let user;
    try {
      user = JSON.parse(userData);
    } catch (error) {
      console.error("Failed to parse userData:", error);
      return;
    }

    if (!user?.user_id) return;

    // เชื่อมต่อ Socket
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Connected to Notification Server");
      // ส่ง user_id ไปบอก Server ว่า "ฉันคือใคร"
      socketRef.current.emit("join_user", user.user_id);
    });

    socketRef.current.on("connect_error", (error) => {
      console.warn("⚠️ Socket connection error:", error.message);
    });

    // ดักรอ Event ชื่อ 'notification'
    socketRef.current.on("notification", (data) => {
      console.log("📩 Received Notification:", data);

      // สั่ง Toast เด้ง!
      toast(data.message, {
        icon: data.type === "success" ? "✅" : data.type === "error" ? "❌" : "🔔",
        duration: 5000,
        position: "top-right",
        style: {
          border: "1px solid #713200",
          padding: "16px",
          color: "#713200",
        },
      });
    });

    // Cleanup: ตัดการเชื่อมต่อเมื่อ Component ถูกทำลาย
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log("❌ Disconnected from Notification Server");
      }
    };
  }, []);
};

export default useSocketNotification;
