import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/api";
import { NeoButton } from "../components/ui/NeoButton";
import { NeoInput } from "../components/ui/NeoInput";

export const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await authService.register(email, password);
      await authService.login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Registration Failed. Email might be taken.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 dark:bg-dark-bg">
      <form onSubmit={handleRegister} className="
        w-full max-w-md p-8 border-2 border-black bg-white 
        shadow-neo flex flex-col gap-6
        dark:bg-dark-card dark:border-white dark:shadow-neo-dark
      ">
        <h2 className="text-4xl font-black uppercase text-center text-neo-purple">
          New Personnel
        </h2>
        
        {error && (
          <div className="p-3 bg-neo-red text-white font-bold border-2 border-black text-center">
            {error}
          </div>
        )}

        <NeoInput 
          label="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="new.user@example.com"
        />
        
        <NeoInput 
          label="Password" 
          type="password"
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Choose a strong password"
        />

        <NeoButton variant="primary" type="submit" className="w-full bg-neo-purple hover:bg-purple-700">
          GRANT CLEARANCE
        </NeoButton>

        <p className="text-center font-bold text-sm">
          ALREADY AUTHORIZED? <Link to="/login" className="underline text-neo-blue">ENTER SYSTEM</Link>
        </p>
      </form>
    </div>
  );
};
