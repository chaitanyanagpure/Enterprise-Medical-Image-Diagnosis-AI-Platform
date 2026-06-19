/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          blue: "#2563EB",     // Primary
          navy: "#0F172A",     // Secondary
          cyan: "#06B6D4",     // Accent
          emerald: "#10B981",  // Success
          amber: "#F59E0B",    // Warning
          rose: "#EF4444",      // Error
          graybg: "#F8FAFC",   // Background
          darktext: "#111827", // Text
          softgray: "#E5E7EB"  // Borders
        }
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "sans-serif"]
      }
    },
  },
  plugins: [],
}
