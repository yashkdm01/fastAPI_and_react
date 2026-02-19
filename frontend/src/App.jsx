import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register"; 
import { Dashboard } from "./pages/Dashboard"; 
import { ThemeToggle } from "./components/ui/ThemeToggle";
import { SignDocument } from "./pages/SignDocument";
import { PublicView } from "./pages/PublicView";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <div className="min-h-screen transition-colors duration-300 dark:bg-dark-bg text-neo-black dark:text-neo-white">
      <div className="fixed bottom-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/public/view/:token" element={<PublicView />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sign/:id" element={<SignDocument />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;