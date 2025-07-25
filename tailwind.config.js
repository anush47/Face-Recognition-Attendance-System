/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#7f9cf5",
          DEFAULT: "#5a67d8",
          dark: "#4c51bf",
        },
        secondary: {
          light: "#f6ad55",
          DEFAULT: "#ed8936",
          dark: "#dd6b20",
        },
        success: {
          light: "#68d391",
          DEFAULT: "#48bb78",
          dark: "#38a169",
        },
        warning: {
          light: "#f6e05e",
          DEFAULT: "#d69e2e",
          dark: "#b7791f",
        },
        destructive: {
          light: "#fc8181",
          DEFAULT: "#f56565",
          dark: "#c53030",
        },
        background: {
          light: "#f7fafc",
          DEFAULT: "#edf2f7",
          dark: "#e2e8f0",
        },
        text: {
          light: "#a0aec0",
          DEFAULT: "#718096",
          dark: "#4a5568",
        },
      },
      boxShadow: {
        primary: "0 0 10px 0 rgba(90, 103, 216, 0.5)",
      },
    },
  },
  plugins: [],
};
