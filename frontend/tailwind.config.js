/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', 
  theme: {
    extend: {
      colors: {
        // Stark Black & White
        'neo-black': '#000000',
        'neo-white': '#ffffff',
        
        // Brutalist Accents (High Saturation)
        'neo-yellow': '#FFDE00', // Construction Yellow
        'neo-blue': '#2B45F5',   // Hyper Blue
        'neo-red': '#FF2A00',    // Alert Red
        'neo-purple': '#A633F5', 
        
        // Muted Backgrounds (for dark mode)
        'dark-bg': '#1a1a1a',
        'dark-card': '#2a2a2a',
      },
      boxShadow: {
        // The "Hard" Shadow (The trademark of Neo-Brutalism)
        'neo': '4px 4px 0px 0px rgba(0,0,0,1)',
        'neo-hover': '6px 6px 0px 0px rgba(0,0,0,1)',
        'neo-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
        
        // Dark Mode Reverse Shadow (White shadow on black)
        'neo-dark': '4px 4px 0px 0px rgba(255,255,255,1)',
      },
      fontFamily: {
        // We will stick to system sans for raw speed, or import "Space Grotesk" later
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'], 
      }
    },
  },
  plugins: [],
}