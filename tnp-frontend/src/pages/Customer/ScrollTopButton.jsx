import { Fab, Zoom, useTheme } from "@mui/material";
import React, { useState, useEffect, useContext } from "react";
import { MdKeyboardArrowUp } from "react-icons/md";

import ScrollContext from "./ScrollContext";

/**
 * A button that appears when the user scrolls down and allows them to
 * easily return to the top of the page.
 */
const ScrollTopButton = () => {
  const [visible, setVisible] = useState(false);
  const { scrollToTop } = useContext(ScrollContext);
  const theme = useTheme();

  useEffect(() => {
    // Track scrolling to show/hide the button
    const handleScroll = () => {
      // Show button when page is scrolled down 400px
      const scrolled = document.documentElement.scrollTop;
      if (scrolled > 400) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);

    // Clean up the event listener
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Handle click on the button
  const handleClick = () => {
    scrollToTop();
  };

  return (
    <Zoom in={visible}>
      <Fab
        color="error"
        size="small"
        aria-label="scroll back to top"
        onClick={handleClick}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 1000,
          boxShadow: theme.shadows[3],
        }}
      >
        <MdKeyboardArrowUp size={24} />
      </Fab>
    </Zoom>
  );
};

export default ScrollTopButton;
