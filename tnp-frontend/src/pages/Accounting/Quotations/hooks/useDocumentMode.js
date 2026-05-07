import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const STORAGE_KEY = "accountingDocsMode";
const VALID_MODES = ["quotation", "invoice"];
const DEFAULT_MODE = "quotation";

/**
 * URL-driven mode toggle for the unified Quotations/Invoices page.
 *
 * Source of truth = `?type=` query param. URL with no param resolves to
 * DEFAULT_MODE ("quotation"). localStorage is no longer consulted —
 * navigating to /accounting/quotations always lands on quotations regardless
 * of the user's last visited mode (fixes the "wrong default on direct nav"
 * bug where a stale localStorage="invoice" hijacked the page).
 *
 * `setMode` is stable across renders (only depends on `setSearchParams`)
 * because it uses the functional updater of `setSearchParams`. Previous
 * version listed `searchParams` in deps which made the callback unstable
 * and contributed to the freeze when a parent component used `setMode` in
 * its own effect deps array.
 */
export const useDocumentMode = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Migration: drop the legacy localStorage entry so it can't resurface
  // through any other code path. One-shot on mount.
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== null) {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore quota / privacy-mode errors
    }
  }, []);

  const urlType = searchParams.get("type");
  const mode = useMemo(() => {
    return VALID_MODES.includes(urlType) ? urlType : DEFAULT_MODE;
  }, [urlType]);

  const setMode = useCallback(
    (next) => {
      if (!VALID_MODES.includes(next)) return;
      setSearchParams(
        (prev) => {
          const nextParams = new URLSearchParams(prev);
          if (next === DEFAULT_MODE) {
            nextParams.delete("type");
          } else {
            nextParams.set("type", next);
          }
          // Status filter ของแต่ละ mode คนละชุด — รีเซ็ต URL status param ด้วย
          nextParams.delete("status");
          nextParams.delete("selected");
          return nextParams;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  return { mode, setMode };
};
