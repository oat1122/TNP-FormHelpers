import toast from "react-hot-toast";

export const showSuccess = (msg, opts = {}) => toast.success(msg, { duration: 3000, ...opts });
export const showError = (msg, opts = {}) => toast.error(msg, { duration: 5000, ...opts });
export const showInfo = (msg, opts = {}) => toast(msg, { duration: 3500, ...opts });
export const showLoading = (msg = "กำลังดำเนินการ…", opts = {}) => toast.loading(msg, opts);
export const dismissToast = (id) => toast.dismiss(id);
