import { useCallback } from 'react';
import {
  open_dialog_error,
  open_dialog_ok_timer
} from "../utils/import_lib";

export const useApiErrorHandler = () => {
  const handleError = useCallback((error, defaultMessage = "เกิดข้อผิดพลาด") => {
    const errorMessage = error?.data?.message || error?.message || defaultMessage;
    open_dialog_error(errorMessage, error);
    console.error("API Error:", error);
  }, []);

  const handleSuccess = useCallback((message, callback) => {
    open_dialog_ok_timer(message).then(() => {
      if (callback) callback();
    });
  }, []);

  return { handleError, handleSuccess };
};
