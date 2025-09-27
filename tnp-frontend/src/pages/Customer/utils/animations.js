// Animation utilities for Customer Filter components
// These animations enhance user experience with smooth transitions

export const animations = {
  // Bounce animation for status changes
  bounce: {
    "@keyframes bounce": {
      "0%, 20%, 53%, 80%, 100%": {
        transform: "translate3d(0, 0, 0)",
      },
      "40%, 43%": {
        transform: "translate3d(0, -8px, 0)",
      },
      "70%": {
        transform: "translate3d(0, -4px, 0)",
      },
      "90%": {
        transform: "translate3d(0, -2px, 0)",
      },
    },
    animation: "bounce 1s ease-in-out",
  },

  // Pulse animation for active elements
  pulse: {
    "@keyframes pulse": {
      "0%": {
        transform: "scale(1)",
        boxShadow: "0 0 0 0 rgba(148, 12, 12, 0.4)",
      },
      "70%": {
        transform: "scale(1.02)",
        boxShadow: "0 0 0 8px rgba(148, 12, 12, 0)",
      },
      "100%": {
        transform: "scale(1)",
        boxShadow: "0 0 0 0 rgba(148, 12, 12, 0)",
      },
    },
    animation: "pulse 2s infinite",
  },

  // Shake animation for errors
  shake: {
    "@keyframes shake": {
      "0%, 100%": { transform: "translateX(0)" },
      "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-2px)" },
      "20%, 40%, 60%, 80%": { transform: "translateX(2px)" },
    },
    animation: "shake 0.5s ease-in-out",
  },

  // Fade in animation
  fadeIn: {
    "@keyframes fadeIn": {
      "0%": { opacity: 0, transform: "translateY(10px)" },
      "100%": { opacity: 1, transform: "translateY(0)" },
    },
    animation: "fadeIn 0.3s ease-out",
  },

  // Slide down animation
  slideDown: {
    "@keyframes slideDown": {
      "0%": {
        opacity: 0,
        transform: "translateY(-10px)",
        maxHeight: 0,
      },
      "100%": {
        opacity: 1,
        transform: "translateY(0)",
        maxHeight: "200px",
      },
    },
    animation: "slideDown 0.3s ease-out",
  },

  // Scale up animation
  scaleUp: {
    "@keyframes scaleUp": {
      "0%": { transform: "scale(0.95)", opacity: 0 },
      "100%": { transform: "scale(1)", opacity: 1 },
    },
    animation: "scaleUp 0.2s ease-out",
  },

  // Hover lift effect
  hoverLift: {
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 25px rgba(148, 12, 12, 0.15)",
    },
  },

  // Button press animation
  buttonPress: {
    transition: "all 0.1s ease",
    "&:active": {
      transform: "scale(0.98)",
    },
  },

  // Chip selection animation
  chipSelect: {
    "@keyframes chipSelect": {
      "0%": { transform: "scale(1)" },
      "50%": { transform: "scale(1.1)" },
      "100%": { transform: "scale(1)" },
    },
    animation: "chipSelect 0.3s ease",
  },

  // Loading spinner
  spin: {
    "@keyframes spin": {
      "0%": { transform: "rotate(0deg)" },
      "100%": { transform: "rotate(360deg)" },
    },
    animation: "spin 1s linear infinite",
  },

  // Success check animation
  checkMark: {
    "@keyframes checkMark": {
      "0%": { transform: "scale(0) rotate(45deg)" },
      "50%": { transform: "scale(1.2) rotate(45deg)" },
      "100%": { transform: "scale(1) rotate(45deg)" },
    },
    animation: "checkMark 0.4s ease-out",
  },
};

// Transition presets for common UI patterns
export const transitions = {
  // Smooth property transitions
  smooth: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  fast: "all 0.15s ease-out",
  slow: "all 0.5s ease-in-out",

  // Bezier curves for different feelings
  easeOutBack: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
  easeInOutQuart: "all 0.3s cubic-bezier(0.76, 0, 0.24, 1)",
  easeOutExpo: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",

  // Specific property transitions
  transform: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  opacity: "opacity 0.2s ease-in-out",
  colors: "background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease",
  shadows: "box-shadow 0.3s ease",
};

// Interactive states with animations
export const interactiveStates = {
  // Hover effects for cards
  cardHover: {
    transition: transitions.smooth,
    "&:hover": {
      transform: "translateY(-4px) scale(1.01)",
      boxShadow: "0 12px 40px rgba(148, 12, 12, 0.15)",
      "& .filter-icon": {
        transform: "scale(1.1)",
      },
    },
  },

  // Button interactions
  buttonHover: {
    transition: transitions.smooth,
    "&:hover": {
      transform: "translateY(-1px)",
      boxShadow: "0 6px 20px rgba(148, 12, 12, 0.25)",
    },
    "&:active": {
      transform: "translateY(0)",
      transition: transitions.fast,
    },
  },

  // Input focus states
  inputFocus: {
    transition: transitions.smooth,
    "&:focus-within": {
      transform: "scale(1.01)",
      boxShadow: "0 0 0 3px rgba(148, 12, 12, 0.1)",
    },
  },

  // Chip interactions
  chipHover: {
    transition: transitions.fast,
    "&:hover": {
      transform: "scale(1.05)",
      filter: "brightness(1.1)",
    },
  },
};

// Animation helpers
export const animationHelpers = {
  // Stagger animation for multiple elements
  stagger: (index, delay = 0.1) => ({
    animationDelay: `${index * delay}s`,
  }),

  // Conditional animation based on state
  conditionalAnimation: (condition, animation) => (condition ? animation : {}),

  // Create entrance animation
  entrance: (type = "fadeIn", delay = 0) => ({
    ...animations[type],
    animationDelay: `${delay}s`,
    animationFillMode: "both",
  }),

  // Create exit animation
  exit: (type = "fadeOut", duration = 0.3) => ({
    transition: `all ${duration}s ease-in-out`,
    opacity: 0,
    transform: type === "slideUp" ? "translateY(-10px)" : "scale(0.95)",
  }),
};

// Performance optimized animations
export const performanceAnimations = {
  // Use transform and opacity for best performance
  optimizedSlide: {
    transform: "translate3d(0, 0, 0)", // Enable hardware acceleration
    transition: "transform 0.3s ease, opacity 0.3s ease",
  },

  // GPU-accelerated animations
  gpuAccelerated: {
    willChange: "transform, opacity",
    backfaceVisibility: "hidden",
    perspective: 1000,
  },
};

export default {
  animations,
  transitions,
  interactiveStates,
  animationHelpers,
  performanceAnimations,
};
