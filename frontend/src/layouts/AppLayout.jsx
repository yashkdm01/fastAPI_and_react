import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

export default function AppLayout({ children }) {
  
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      
      {/* sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-200">
        <div className="p-6 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
            J
          </div>
          <span className="font-bold text-xl tracking-tight">JiraClone</span>
        </div>

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

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-sm px-4 py-2 transition-colors"
          >
              🚪 Sign Out
          </button>
        </div>
      </div>

      {/* main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* top bar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center px-8 transition-colors duration-200">
          <h2 className="text-lg font-medium text-gray-500 dark:text-gray-400">
             {location.pathname.includes('project') ? 'Project Board' : 'Overview'}
          </h2>

          {/* dark mode switch */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-yellow-400 hover:ring-2 ring-blue-500 transition-all focus:outline-none"
          >
            {darkMode ? (
              // Sun Icon (For Dark Mode)
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </header>

        {/* render children */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-200">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
