import { createContext } from "react";

// Create a context with a default empty function
const ScrollContext = createContext({ scrollToTop: () => {} });

export default ScrollContext;
