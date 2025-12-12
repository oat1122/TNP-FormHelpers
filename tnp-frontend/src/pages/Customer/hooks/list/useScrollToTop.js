import { useRef, useCallback } from "react";

/**
 * Hook สำหรับจัดการการ scroll ไปด้านบนของตาราง
 * @returns {{ tableContainerRef: React.RefObject, scrollToTop: () => void }}
 */
export const useScrollToTop = () => {
  const tableContainerRef = useRef(null);

  const scrollToTop = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      if (tableContainerRef && tableContainerRef.current) {
        setTimeout(() => {
          try {
            tableContainerRef.current.scrollIntoView({
              behavior: "smooth",
              block: "start",
              inline: "nearest",
            });

            const containerRect = tableContainerRef.current.getBoundingClientRect();
            if (containerRect.top < 0) {
              window.scrollBy({
                top: containerRect.top - 20,
                behavior: "smooth",
              });
            }
          } catch (innerError) {
            console.warn("Smooth scrolling not supported in timeout, using fallback", innerError);
            if (tableContainerRef.current) {
              tableContainerRef.current.scrollIntoView(true);
            } else {
              window.scrollTo(0, 0);
            }
          }
        }, 50);
      } else {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    } catch (error) {
      console.warn("Error in scrollToTop, using basic fallback", error);
      try {
        window.scrollTo(0, 0);
      } catch (finalError) {
        console.error("Failed to scroll to top", finalError);
      }
    }
  }, []);

  return { tableContainerRef, scrollToTop };
};
