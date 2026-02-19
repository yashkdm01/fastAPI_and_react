export const NeoInput = ({ label, type = "text", value, onChange, placeholder }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="font-bold uppercase tracking-wider text-sm">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="
          p-4 border-2 border-black bg-neo-white 
          shadow-neo focus:shadow-neo-hover focus:translate-x-[-2px] focus:translate-y-[-2px]
          transition-all outline-none font-mono
          dark:border-white dark:bg-dark-card dark:shadow-neo-dark
        "
      />
    </div>
  );
};