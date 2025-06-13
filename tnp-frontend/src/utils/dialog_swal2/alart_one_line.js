import Swal from "sweetalert2"
import "./dialog_swal2.css";
import toast from 'react-hot-toast';

// Toast configuration - can be customized
const toastConfig = {
  position: 'bottom-left',
  duration: 4000,
  style: {
    borderRadius: '8px',
    padding: '12px 16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    fontSize: '14px',
  },
};

// Custom styles for different toast types
const errorStyle = {
  ...toastConfig.style,
  background: '#FEE2E2',
  color: '#B91C1C',
  border: '1px solid #FECACA',
};

const successStyle = {
  ...toastConfig.style,
  background: '#DCFCE7', 
  color: '#15803D',
  border: '1px solid #BBF7D0',
};

const warningStyle = {
  ...toastConfig.style,
  background: '#FEF3C7',
  color: '#B45309',
  border: '1px solid #FDE68A',
};

const loadingStyle = {
  ...toastConfig.style,
  background: '#EFF6FF',
  color: '#1D4ED8',
  border: '1px solid #BFDBFE',
};

// We don't need a Toast Provider since we're using it directly in main.jsx
// export const ToastProvider = ({ children }) => {
//   return (
//     <>
//       {children}
//       <div id="toast-container">
//         {toast.Toaster}
//       </div>
//     </>
//   );
// };

export function open_dialog_error(title, text) {
  // Still keep Swal for backward compatibility
  Swal.close();
  
  // ปิด loading toast ถ้ามี
  dismiss_loading_toast();
  
  // Use toast for new notifications
  return toast.error(
    title + (text ? '\n' + text : ''),
    { 
      position: 'bottom-left',
      duration: 5000,
      style: errorStyle,
    }
  );
}

export function open_dialog_error_timer(title, text) {
  Swal.close();
  
  return toast.error(
    title + (text ? '\n' + text : ''),
    { 
      position: 'bottom-left',
      duration: 1500,
      style: errorStyle,
    }
  );
}

export function open_dialog_ok(title, text) {
  Swal.close();
  
  return toast.success(
    title + (text ? '\n' + text : ''),
    { 
      position: 'bottom-left',
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
    title, 
    { 
      position: 'bottom-left',
      duration: 1300,
      style: successStyle,
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
    title + (text ? '\n' + text : ''),
    { 
      position: 'bottom-left',
      duration: 4000,
      style: warningStyle,
      icon: '⚠️',
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
  
  // Create new loading toast and store its ID
  activeLoadingToast = toast.loading(
    'กำลังประมวลผล', 
    { 
      position: 'bottom-left',
      style: loadingStyle,
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

export function open_dialog_three_btn(title, cancelBtnText, confirmBtnText, denyBtnText) {
  return new Promise((resolve) => {
    Swal.fire({
      title: title,
      showDenyButton: true,
      showCancelButton: true,
      cancelButtonText: cancelBtnText,
      confirmButtonText: confirmBtnText,
      denyButtonText: denyBtnText
    }).then((result) => {
      resolve(result);
    })
  })
}
