import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const STORAGE_KEY = "accountingDocsMode";
const VALID_MODES = ["quotation", "invoice"];
const DEFAULT_MODE = "quotation";

const readPersistedMode = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return VALID_MODES.includes(stored) ? stored : null;
  } catch {
    return null;
  }
};

export const useDocumentMode = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlType = searchParams.get("type");
  const mode = useMemo(() => {
    if (VALID_MODES.includes(urlType)) return urlType;
    return readPersistedMode() || DEFAULT_MODE;
  }, [urlType]);

  const setMode = useCallback(
    (next) => {
      if (!VALID_MODES.includes(next)) return;
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore quota errors
      }
      const nextParams = new URLSearchParams(searchParams);
      if (next === DEFAULT_MODE) {
        nextParams.delete("type");
      } else {
        nextParams.set("type", next);
      }
      // Status filter ของแต่ละ mode คนละชุด — รีเซ็ต URL status param ด้วย
      nextParams.delete("status");
      nextParams.delete("selected");
      setSearchParams(nextParams, { replace: false });
    },
    [searchParams, setSearchParams]
  );

  return { mode, setMode };
};
