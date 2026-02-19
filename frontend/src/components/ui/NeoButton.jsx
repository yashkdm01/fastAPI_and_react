import { motion } from "framer-motion";

export const NeoButton = ({ children, onClick, variant = "primary", className = "" }) => {
  
  // color logic
  const variants = {
    primary: "bg-neo-blue text-white hover:bg-blue-700",
    secondary: "bg-neo-white text-neo-black hover:bg-gray-100",
    danger: "bg-neo-red text-white hover:bg-red-700",
    warning: "bg-neo-yellow text-neo-black hover:bg-yellow-400"
  };

  return (
    <motion.button
      whileHover={{ translate: "2px 2px", boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" }} 
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative px-6 py-3 font-bold border-2 border-black 
        shadow-neo transition-all duration-100 ease-in-out
        dark:border-white dark:shadow-neo-dark
        ${variants[variant]} 
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
};