import { useCallback, useRef, useState } from "react";

import { useCheckNotebookDuplicateMutation } from "../../../features/Notebook/notebookApi";

const FIELD_TO_TYPE = {
  nb_contact_number: "phone",
  nb_email: "email",
  nb_customer_name: "customer_name",
  nb_contact_person: "contact_person",
};

const FIELD_TYPES = ["phone", "email", "customer_name", "contact_person"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const digitsOnly = (value) => String(value ?? "").replace(/[^\d]/g, "");

const isValidCandidate = (type, trimmed) => {
  if (!trimmed) {
    return false;
  }

  if (type === "phone") {
    return digitsOnly(trimmed).length >= 8;
  }

  if (type === "email") {
    return EMAIL_REGEX.test(trimmed);
  }

  return trimmed.length >= 3;
};

const matchesAreEmpty = (match) =>
  !match || ((match.customers || []).length === 0 && (match.notebooks || []).length === 0);

export const useNotebookDuplicateCheck = ({ excludeNotebookId } = {}) => {
  const [checkDuplicate] = useCheckNotebookDuplicateMutation();

  const [duplicates, setDuplicates] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("field");
  const [activeType, setActiveType] = useState(null);

  const pendingResolverRef = useRef(null);

  const latestValuesRef = useRef({});

  const runCheck = useCallback(
    async (type, rawValue) => {
      const trimmed = String(rawValue ?? "").trim();
      latestValuesRef.current[type] = trimmed;

      if (!isValidCandidate(type, trimmed)) {
        setDuplicates((previous) => {
          if (!previous[type]) {
            return previous;
          }

          const next = { ...previous };
          delete next[type];
          return next;
        });
        return { customers: [], notebooks: [] };
      }

      try {
        const response = await checkDuplicate({
          type,
          value: trimmed,
          exclude_notebook_id: excludeNotebookId || undefined,
        }).unwrap();

        if (latestValuesRef.current[type] !== trimmed) {
          return { customers: [], notebooks: [] };
        }

        const payload = {
          type,
          value: trimmed,
          customers: response?.customers || [],
          notebooks: response?.notebooks || [],
        };

        setDuplicates((previous) => {
          const next = { ...previous };
          if (matchesAreEmpty(payload)) {
            delete next[type];
          } else {
            next[type] = payload;
          }
          return next;
        });

        return payload;
      } catch {
        return { customers: [], notebooks: [] };
      }
    },
    [checkDuplicate, excludeNotebookId]
  );

  const checkField = useCallback(
    async (fieldOrType, value) => {
      const type = FIELD_TO_TYPE[fieldOrType] || fieldOrType;
      const payload = await runCheck(type, value);

      if (!matchesAreEmpty(payload)) {
        setActiveType(type);
        setDialogMode("field");
        setDialogOpen(true);
      }

      return payload;
    },
    [runCheck]
  );

  const runSaveCheck = useCallback(
    async (draft) => {
      const fields = {
        phone: draft?.nb_contact_number,
        email: draft?.nb_email,
        customer_name: draft?.nb_customer_name,
        contact_person: draft?.nb_contact_person,
      };

      const results = await Promise.all(
        FIELD_TYPES.map((type) => runCheck(type, fields[type] ?? ""))
      );

      const hasDuplicate = results.some((match) => !matchesAreEmpty(match));

      if (!hasDuplicate) {
        return true;
      }

      setActiveType(null);
      setDialogMode("save");
      setDialogOpen(true);

      return new Promise((resolve) => {
        pendingResolverRef.current = resolve;
      });
    },
    [runCheck]
  );

  const acknowledgeAndContinue = useCallback(() => {
    setDialogOpen(false);
    const resolve = pendingResolverRef.current;
    pendingResolverRef.current = null;
    if (resolve) {
      resolve(true);
    }
  }, []);

  const cancelSave = useCallback(() => {
    setDialogOpen(false);
    const resolve = pendingResolverRef.current;
    pendingResolverRef.current = null;
    if (resolve) {
      resolve(false);
    }
  }, []);

  const closeDialog = useCallback(() => {
    if (dialogMode === "save") {
      cancelSave();
      return;
    }
    setDialogOpen(false);
  }, [cancelSave, dialogMode]);

  const resetAll = useCallback(() => {
    setDuplicates({});
    setDialogOpen(false);
    setDialogMode("field");
    setActiveType(null);
    latestValuesRef.current = {};
    const resolve = pendingResolverRef.current;
    pendingResolverRef.current = null;
    if (resolve) {
      resolve(false);
    }
  }, []);

  return {
    duplicates,
    dialogOpen,
    dialogMode,
    activeType,
    checkField,
    runSaveCheck,
    acknowledgeAndContinue,
    cancelSave,
    closeDialog,
    resetAll,
  };
};
