import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-3 border-2 border-black bg-neo-white shadow-neo dark:border-white dark:bg-neo-black dark:shadow-neo-dark transition-all active:translate-y-[2px] active:shadow-none"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === "dark" ? 180 : 0 }}
      >
        {theme === "dark" ? <Sun className="text-white" size={24} /> : <Moon className="text-black" size={24} />}
      </motion.div>
    </button>
  );
};