import { useState, useCallback } from "react";

/**
 * useSnackbar - Reusable snackbar state management
 */
export const useSnackbar = (defaultSeverity = "success") => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: defaultSeverity,
  });

  const showSnackbar = useCallback(
    (message, severity = defaultSeverity) => {
      setSnackbar({
        open: true,
        message,
        severity,
      });
    },
    [defaultSeverity]
  );

  const showSuccess = useCallback(
    (message) => {
      showSnackbar(message, "success");
    },
    [showSnackbar]
  );

  const showError = useCallback(
    (message) => {
      showSnackbar(message, "error");
    },
    [showSnackbar]
  );

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    snackbar,
    showSnackbar,
    showSuccess,
    showError,
    closeSnackbar,
  };
};

export default useSnackbar;
