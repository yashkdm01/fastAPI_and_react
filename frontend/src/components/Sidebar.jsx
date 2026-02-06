import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-200">
      
      {/* Logo Section */}
      <div className="p-6 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
          J
        </div>
        <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">TaskFlow</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1">
        <Link 
          to="/dashboard" 
          className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${
            location.pathname === '/dashboard' 
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          📊 Dashboard
        </Link>
        
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2 px-4">
          Projects
        </div>
      </nav>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button 
          onClick={logout} 
          className="w-full flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-sm px-4 py-2 transition-colors"
        >
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}
