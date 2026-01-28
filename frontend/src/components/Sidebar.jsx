import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { logout } = useAuth();
  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-100 font-bold text-xl text-blue-600">
        JiraClone
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1">
        <Link to="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md">Dashboard</Link>
      </nav>
      <div className="p-4 border-t border-gray-100">
        <button onClick={logout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md">Sign Out</button>
      </div>
    </div>
  );
}