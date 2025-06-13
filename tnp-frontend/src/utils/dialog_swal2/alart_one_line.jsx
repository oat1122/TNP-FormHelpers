import Swal from "sweetalert2";
import "./dialog_swal2.css";
import "./toast_animations.css"; // Import custom toast animations
import toast from "react-hot-toast";

// Toast configuration - can be customized with enhanced styling
const toastConfig = {
  position: "bottom-left",
  duration: 4000,
  style: {
    borderRadius: "12px",
    padding: "16px 20px",
    boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
    fontSize: "14px",
    maxWidth: "380px",
    fontWeight: 500,
    backdropFilter: "blur(8px)",
  },
};

// Enhanced custom styles for different toast types with gradients and better visual hierarchy
const errorStyle = {
  ...toastConfig.style,
  background: "linear-gradient(135deg, #FEE2E2 0%, #FECDD3 100%)",
  color: "#991B1B",
  border: "none",
  boxShadow:
    "0 8px 16px rgba(220, 38, 38, 0.2), inset 0 -2px 0 rgba(220, 38, 38, 0.1)",
};

const successStyle = {
  ...toastConfig.style,
  background: "linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)",
  color: "#166534",
  border: "none",
  boxShadow:
    "0 8px 16px rgba(22, 163, 74, 0.2), inset 0 -2px 0 rgba(22, 163, 74, 0.1)",
};

const warningStyle = {
  ...toastConfig.style,
  background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
  color: "#92400E",
  border: "none",
  boxShadow:
    "0 8px 16px rgba(217, 119, 6, 0.2), inset 0 -2px 0 rgba(217, 119, 6, 0.1)",
};

const loadingStyle = {
  ...toastConfig.style,
  background: "linear-gradient(135deg, #EFF6FF 0%, #BFDBFE 100%)",
  color: "#1E40AF",
  border: "none",
  boxShadow:
    "0 8px 16px rgba(37, 99, 235, 0.2), inset 0 -2px 0 rgba(37, 99, 235, 0.1)",
};

// Show Toast Provider component
export const ToastProvider = ({ children }) => {
  return (
    <>
      {children}
      <div id="toast-container">{toast.Toaster}</div>
    </>
  );
};

export function open_dialog_error(title, text) {
  // Still keep Swal for backward compatibility
  Swal.close();

  // ปิด loading toast ถ้ามี
  dismiss_loading_toast();

  // Use toast for new notifications with ultra-enhanced design
  const toastId = toast.error(
    <div
      className="toast-content toast-3d"
      style={{ display: "flex", alignItems: "flex-start", gap: "12px", position: "relative" }}
    >
      {/* Close button */}
      <button 
        className="toast-close-button"
        onClick={() => toast.dismiss(toastId)}
        aria-label="Close"
        style={{
          position: "absolute",
          top: "-6px",
          right: "-6px",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(239, 68, 68, 0.2)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          cursor: "pointer",
          transition: "all 0.2s ease"
        }}
      >
        <span style={{ fontSize: '9px', color: '#991B1B' }}>✖</span>
      </button>
      
      {/* Enhanced error icon with animation */}
      <div
        className="toast-icon-container toast-icon-error"
        style={{
          background: "radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.1) 100%)",
          borderRadius: "50%",
          width: "36px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "2px",
          boxShadow: "0 4px 8px rgba(239, 68, 68, 0.3), inset 0 1px 3px rgba(255,255,255,0.3)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Animated pulse effect */}
        <div 
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            backgroundColor: "rgba(239, 68, 68, 0.2)",
            animation: "ripple 1.2s ease-out infinite",
            zIndex: 0
          }}
        />
        
        <span 
          role="img" 
          aria-label="error" 
          className="toast-emoji"
          style={{ 
            fontSize: "18px",
            zIndex: 1,
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
            animation: "shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both"
          }}
        >
          ⛔
        </span>
      </div>
      
      {/* Content with enhanced styling */}
      <div style={{ flex: 1 }}>
        <div 
          className="toast-title" 
          style={{ 
            fontWeight: "700", 
            fontSize: "16px",
            background: "linear-gradient(45deg, #991B1B, #EF4444)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 1px 2px rgba(0,0,0,0.1)"
          }}
        >
          {title}
        </div>
        
        {text && (
          <div 
            className="toast-message" 
            style={{
              fontSize: "14px",
              lineHeight: "1.4",
              margin: "4px 0",
              color: "#991B1B",
              fontWeight: "400"
            }}
          >
            {text}
          </div>
        )}
        
        {/* Animated progress bar with glow effect */}
        <div
          className="toast-progress"
          style={{
            height: "3px",
            width: "100%",
            marginTop: "8px",
            background: "rgba(239, 68, 68, 0.15)",
            borderRadius: "3px",
            overflow: "hidden",
            position: "relative"
          }}
        >
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: "100%",
              background: "linear-gradient(90deg, rgba(239, 68, 68, 0.7), rgba(220, 38, 38, 0.9))",
              animation: "progress-bar 5000ms linear forwards",
              boxShadow: "0 0 8px rgba(239, 68, 68, 0.5)"
            }}
          />
        </div>
      </div>
    </div>,
    {
      position: "bottom-left",
      duration: 5000,
      style: {
        ...errorStyle,
        animation: "slideIn 0.3s forwards, shake 0.5s 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97)",
        transformOrigin: "center left",
        boxShadow: "0 10px 25px rgba(220, 38, 38, 0.25), 0 5px 10px rgba(220, 38, 38, 0.15)"
      },
      className: "toast-container",
    }
  );
  
  return toastId;
}

export function open_dialog_error_timer(title, text) {
  Swal.close();

  return toast.error(
    <div
      className="toast-content"
      style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}
    >
      <div
        className="toast-icon-container toast-icon-error"
        style={{
          background:
            "radial-gradient(circle, rgba(220, 38, 38, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)",
          borderRadius: "50%",
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "2px",
          boxShadow: "0 2px 4px rgba(220, 38, 38, 0.3)",
        }}
      >
        <span role="img" aria-label="error" style={{ fontSize: "16px" }}>
          ❌
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <div className="toast-title">{title}</div>
        {text && <div className="toast-message">{text}</div>}
        <div
          className="toast-progress"
          style={{
            background:
              "linear-gradient(to right, rgba(220, 38, 38, 0.5), rgba(220, 38, 38, 0.7))",
            animationDuration: "1500ms",
          }}
        />
      </div>
    </div>,
    {
      position: "bottom-left",
      duration: 1500,
      style: {
        ...errorStyle,
        animation: "slideIn 0.3s forwards",
      },
      className: "toast-container",
    }
  );
}

export function open_dialog_ok(title, text) {
  Swal.close();

  return toast.success(
    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
      <div
        style={{
          backgroundColor: "rgba(22, 163, 74, 0.2)",
          borderRadius: "50%",
          width: "24px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "2px",
        }}
      >
        <span style={{ fontSize: "14px" }}>✓</span>
      </div>
      <div>
        <div
          style={{ fontWeight: "600", marginBottom: "4px", fontSize: "15px" }}
        >
          {title}
        </div>
        {text && <div style={{ fontSize: "13px", opacity: 0.9 }}>{text}</div>}
      </div>
    </div>,
    {
      position: "bottom-left",
      duration: 3000,
      style: successStyle,
    }
  );
}

export function open_dialog_ok_timer(title) {
  Swal.close();

  // ปิด loading toast ถ้ามี
  dismiss_loading_toast();

  const toastId = toast.success(
    <div
      className="toast-content toast-3d"
      style={{ 
        display: "flex", 
        alignItems: "flex-start", 
        gap: "12px",
        position: "relative" 
      }}
    >
      {/* Close button */}
      <button 
        className="toast-close-button"
        onClick={() => toast.dismiss(toastId)}
        aria-label="Close"
      >
        <span style={{ fontSize: '10px', color: '#166534' }}>✖</span>
      </button>
      
      {/* Success icon with enhanced animation */}
      <div
        className="toast-icon-container toast-icon-success"
        style={{
          background:
            "radial-gradient(circle, rgba(22, 163, 74, 0.3) 0%, rgba(22, 163, 74, 0.1) 100%)",
          borderRadius: "50%",
          width: "36px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "2px",
          boxShadow: "0 4px 8px rgba(22, 163, 74, 0.4), inset 0 1px 3px rgba(255,255,255,0.5)",
          border: "1px solid rgba(22, 163, 74, 0.3)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Ripple effect */}
        <div 
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            backgroundColor: "rgba(22, 163, 74, 0.3)",
            animation: "ripple 1s ease-out",
            zIndex: 0
          }}
        />
        
        <span 
          role="img" 
          aria-label="success" 
          className="toast-emoji"
          style={{ 
            fontSize: "18px",
            zIndex: 1,
            filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))"
          }}
        >
          ✅
        </span>
      </div>
      
      {/* Content area with enhanced styling */}
      <div style={{ flex: 1 }}>
        <div 
          className="toast-title" 
          style={{ 
            fontWeight: "600", 
            fontSize: "16px",
            backgroundImage: "linear-gradient(45deg, #166534, #15803d)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "1px 1px 2px rgba(0,0,0,0.1)"
          }}
        >
          {title}
        </div>
        
        {/* Animated progress bar */}
        <div
          className="toast-progress"
          style={{
            background: "rgba(22, 163, 74, 0.2)",
            height: "3px",
            borderRadius: "3px",
            marginTop: "10px",
            overflow: "hidden",
            position: "relative"
          }}
        >
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: "100%",
              background: "linear-gradient(90deg, rgba(22, 163, 74, 0.7), rgba(22, 163, 74, 0.9))",
              animation: "progress-bar 1300ms linear forwards",
              boxShadow: "0 0 5px rgba(22, 163, 74, 0.5)"
            }}
          />
        </div>
      </div>
    </div>,
    {
      position: "bottom-left",
      duration: 1300,
      style: {
        ...successStyle,
        animation: "slideIn 0.3s forwards, pulse 0.5s 0.3s",
        transformOrigin: "center left",
      },
      className: "toast-container",
    }
  );

  // Return a promise to maintain compatibility with existing code
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ isConfirmed: true });
    }, 1300);
  });
}

export function open_dialog_warning(title, text) {
  Swal.close();

  const toastId = toast(
    <div
      className="toast-content toast-3d"
      style={{ display: "flex", alignItems: "flex-start", gap: "12px", position: "relative" }}
    >
      {/* Close button */}
      <button 
        className="toast-close-button"
        onClick={() => toast.dismiss(toastId)}
        aria-label="Close"
        style={{
          position: "absolute",
          top: "-6px",
          right: "-6px",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(245, 158, 11, 0.2)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          cursor: "pointer",
          transition: "all 0.2s ease"
        }}
      >
        <span style={{ fontSize: '9px', color: '#92400E' }}>✖</span>
      </button>
      
      {/* Enhanced warning icon with animation */}
      <div
        className="toast-icon-container toast-icon-warning"
        style={{
          background: "radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, rgba(217, 119, 6, 0.1) 100%)",
          borderRadius: "50%",
          width: "36px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "2px",
          boxShadow: "0 4px 8px rgba(245, 158, 11, 0.3), inset 0 1px 3px rgba(255,255,255,0.3)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          position: "relative",
          overflow: "hidden",
          animation: "bounce 2s infinite ease-in-out"
        }}
      >
        {/* Pulsing glow effect */}
        <div 
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            backgroundColor: "rgba(245, 158, 11, 0.2)",
            animation: "pulse 2s infinite ease-in-out",
            zIndex: 0
          }}
        />
        
        <span 
          role="img" 
          aria-label="warning" 
          className="toast-emoji"
          style={{ 
            fontSize: "20px",
            zIndex: 1,
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
            animation: "float 3s ease-in-out infinite"
          }}
        >
          ⚠️
        </span>
      </div>
      
      {/* Content with enhanced styling */}
      <div style={{ flex: 1 }}>
        <div 
          className="toast-title" 
          style={{ 
            fontWeight: "700", 
            fontSize: "16px",
            background: "linear-gradient(45deg, #92400E, #F59E0B)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 1px 2px rgba(0,0,0,0.1)"
          }}
        >
          {title}
        </div>
        
        {text && (
          <div 
            className="toast-message" 
            style={{
              fontSize: "14px",
              lineHeight: "1.4",
              margin: "4px 0",
              color: "#92400E",
              fontWeight: "400"
            }}
          >
            {text}
          </div>
        )}
        
        {/* Animated progress bar with shimmer effect */}
        <div
          className="toast-progress"
          style={{
            height: "3px",
            width: "100%",
            marginTop: "8px",
            background: "rgba(245, 158, 11, 0.15)",
            borderRadius: "3px",
            overflow: "hidden",
            position: "relative"
          }}
        >
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: "100%",
              background: "linear-gradient(90deg, rgba(245, 158, 11, 0.7), rgba(217, 119, 6, 0.9))",
              animation: "progress-bar 4000ms linear forwards",
              boxShadow: "0 0 8px rgba(245, 158, 11, 0.5)"
            }}
          />
          
          {/* Shimmer effect */}
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: "-100%",
              height: "100%",
              width: "50%",
              background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
              animation: "shimmer 2s infinite linear"
            }}
          />
        </div>
      </div>
    </div>,
    {
      position: "bottom-left",
      duration: 4000,
      style: {
        ...warningStyle,
        animation: "slideIn 0.3s forwards, pulse 0.5s 0.3s",
        transformOrigin: "center left",
        boxShadow: "0 10px 25px rgba(245, 158, 11, 0.25), 0 5px 10px rgba(245, 158, 11, 0.15)"
      },
      className: "toast-container",
      icon: false, // ไม่แสดงไอคอนเริ่มต้น เพราะเรากำหนดเอง
    }
  );

  // Return a promise to maintain compatibility with existing code
  return new Promise((resolve) => {
    const checkIfDismissed = setInterval(() => {
      if (!toast.isActive(toastId)) {
        clearInterval(checkIfDismissed);
        resolve({ isConfirmed: true });
      }
    }, 100);
  });
}

let activeLoadingToast = null;

export function open_dialog_loading() {
  Swal.close();

  // Dismiss previous loading toast if exists
  if (activeLoadingToast) {
    toast.dismiss(activeLoadingToast);
  }

  // Create new loading toast with ultra-enhanced style and animation
  activeLoadingToast = toast.loading(
    <div
      className="toast-content"
      style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}
    >
      <div
        className="toast-icon-container"
        style={{
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.1) 100%)",
          borderRadius: "50%",
          width: "38px",
          height: "38px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "2px",
          boxShadow: "0 4px 10px rgba(37, 99, 235, 0.4), inset 0 1px 3px rgba(255,255,255,0.5)",
          border: "1px solid rgba(37, 99, 235, 0.3)",
          position: "relative",
          overflow: "hidden",
          animation: "pulse 2s infinite ease-in-out"
        }}
      >
        {/* Double spinner for more elegant loading animation */}
        <div
          className="toast-icon-loading"
          style={{
            position: "absolute",
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            border: "2.5px solid transparent",
            borderTopColor: "rgba(37, 99, 235, 0.9)",
            borderLeftColor: "rgba(37, 99, 235, 0.8)",
            animation: "spin 1s linear infinite"
          }}
        />
        <div
          className="toast-icon-loading"
          style={{
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "rgba(59, 130, 246, 0.8)",
            borderRightColor: "rgba(59, 130, 246, 0.6)",
            animation: "spin 0.8s linear infinite reverse"
          }}
        />
      </div>
      
      <div style={{ flex: 1 }}>
        {/* Enhanced title with glow effect */}
        <div 
          className="toast-title" 
          style={{ 
            fontWeight: "600", 
            fontSize: "16px",
            background: "linear-gradient(45deg, #1E40AF, #3B82F6)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "pulse 2s infinite ease-in-out",
            textShadow: "0 0 10px rgba(59, 130, 246, 0.3)"
          }}
        >
          กำลังประมวลผล
        </div>
        
        {/* Dynamic dots animation */}
        <div style={{ fontSize: "12px", marginTop: "2px", color: "#3B82F6" }}>
          <span style={{ 
            display: "inline-block", 
            animation: "bounce 1.2s infinite ease-in-out",
            animationDelay: "0s"
          }}>●</span>
          <span style={{ 
            display: "inline-block", 
            animation: "bounce 1.2s infinite ease-in-out",
            animationDelay: "0.2s",
            marginLeft: "2px"
          }}>●</span>
          <span style={{ 
            display: "inline-block", 
            animation: "bounce 1.2s infinite ease-in-out",
            animationDelay: "0.4s",
            marginLeft: "2px"
          }}>●</span>
        </div>
        
        {/* Improved shimmer loading bar */}
        <div
          style={{
            height: "4px",
            width: "100%",
            marginTop: "8px",
            background: "rgba(37, 99, 235, 0.15)",
            borderRadius: "4px",
            overflow: "hidden",
            position: "relative"
          }}
        >
          {/* Glowing effect */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "-20%",
              height: "100%",
              width: "60%",
              borderRadius: "4px",
              background: "linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.6), transparent)",
              animation: "shimmer 1.5s infinite ease-in-out",
              boxShadow: "0 0 10px rgba(37, 99, 235, 0.5)"
            }}
          />
          
          {/* Primary bar */}
          <div
            style={{
              position: "absolute",
              height: "100%",
              width: "30%",
              borderRadius: "4px",
              background: "linear-gradient(90deg, rgba(37, 99, 235, 0.4), rgba(59, 130, 246, 0.9))",
              animation: "shimmer 2s infinite linear",
              backgroundSize: "200% 100%",
              left: "10%"
            }}
          />
        </div>
      </div>
    </div>,
    {
      position: "bottom-left",
      style: {
        ...loadingStyle,
        animation: "slideIn 0.3s forwards",
        boxShadow: "0 10px 25px rgba(37, 99, 235, 0.25), 0 5px 10px rgba(37, 99, 235, 0.15)"
      },
      className: "toast-container",
      duration: Infinity,
    }
  );

  return activeLoadingToast;
}

// Helper function to dismiss active loading toast
export function dismiss_loading_toast() {
  if (activeLoadingToast) {
    toast.dismiss(activeLoadingToast);
    activeLoadingToast = null;
  }
}

export function open_dialog_three_btn(
  title,
  cancelBtnText,
  confirmBtnText,
  denyBtnText
) {
  return new Promise((resolve) => {
    Swal.fire({
      title: title,
      showDenyButton: true,
      showCancelButton: true,
      cancelButtonText: cancelBtnText,
      confirmButtonText: confirmBtnText,
      denyButtonText: denyBtnText,
    }).then((result) => {
      resolve(result);
    });
  });
}
