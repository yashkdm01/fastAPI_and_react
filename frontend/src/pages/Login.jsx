import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/api";
import { NeoButton } from "../components/ui/NeoButton";
import { NeoInput } from "../components/ui/NeoInput";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await authService.login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid Credentials. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 dark:bg-dark-bg">
      <form onSubmit={handleLogin} className="
        w-full max-w-md p-8 border-2 border-black bg-white 
        shadow-neo flex flex-col gap-6
        dark:bg-dark-card dark:border-white dark:shadow-neo-dark
      ">
        <h2 className="text-4xl font-black uppercase text-center text-neo-blue">
          Enter System
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
          placeholder="user@example.com"
        />
        
        <NeoInput 
          label="Password" 
          type="password"
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="••••••••"
        />

        <NeoButton variant="primary" type="submit" className="w-full">
          AUTHENTICATE
        </NeoButton>

        <p className="text-center font-bold text-sm">
          NO ACCESS? <Link to="/register" className="underline text-neo-blue">REQUEST CLEARANCE</Link>
        </p>
      </form>
    </div>
  );
};
