import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Key, AlertCircle, DollarSign, Copy } from 'lucide-react';

export default function App() {
  // Enhanced initial state with logs as an empty array to prevent .map() errors[cite: 1, 2]
  const [data, setData] = useState({ total_requests: 0, active_keys: 0, error_rate: "0%", revenue_estimate: 0, logs: [] });
  const [myKey, setMyKey] = useState("");

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/internal/dashboard');
      // Ensure backend data structure matches frontend expectations
      setData(res.data);
    } catch (err) { console.error("Dashboard Fetch Error:", err); }
  };

  const generateKey = async () => {
    try {
      const res = await axios.post('http://127.0.0.1:8000/internal/keys/generate');
      setMyKey(res.data.api_key);
      fetchStats();
    } catch (err) { console.error("Key Generation Error:", err); }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3000); // Live update every 3 seconds[cite: 1]
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-indigo-400">MeterFlow Dashboard</h1>
            <p className="text-slate-400">Usage-Based API Billing & Metering Platform[cite: 1, 2]</p>
          </div>
          <button onClick={generateKey} className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-lg font-medium transition shadow-lg shadow-indigo-500/20">
            Generate API Key
          </button>
        </div>

        {myKey && (
          <div className="bg-slate-800 p-4 rounded-lg mb-8 border border-indigo-500/30 flex justify-between items-center animate-pulse">
            <div>
              <span className="text-slate-400 mr-4 font-medium uppercase text-xs tracking-wider">Your Active Key:</span>
              <code className="text-emerald-400 font-mono text-lg">{myKey}</code>
              <p className="text-xs text-slate-500 mt-2 italic font-mono">
                Usage: curl -H "X-API-Key: {myKey}" http://127.0.0.1:8000/posts/1
              </p>
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(myKey)}
              className="p-2 hover:bg-slate-700 rounded-md transition"
              title="Copy Key"
            >
              <Copy size={18} className="text-slate-400" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatBox icon={<Activity className="text-blue-400"/>} title="Total Requests" value={data.total_requests} />
          <StatBox icon={<Key className="text-emerald-400"/>} title="Active API Keys" value={data.active_keys} />
          <StatBox icon={<AlertCircle className="text-rose-400"/>} title="Error Rate" value={data.error_rate} />
          <StatBox icon={<DollarSign className="text-amber-400"/>} title="Est. Revenue" value={`$${(data.revenue_estimate || 0).toFixed(2)}`} />
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
             <h2 className="text-xl font-semibold">Live Gateway Traffic[cite: 1, 2]</h2>
             <span className="flex items-center text-xs text-emerald-400 animate-pulse">
               <span className="h-2 w-2 rounded-full bg-emerald-400 mr-2"></span> Real-time
             </span>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4 font-semibold">Endpoint</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-right">Latency (ms)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {data.logs.length > 0 ? data.logs.map((log, i) => (
                <tr key={i} className="hover:bg-slate-700/40 transition">
                  <td className="p-4 font-mono text-sm text-indigo-300">{log.endpoint}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${log.status < 400 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-rose-900/50 text-rose-400'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono text-slate-300">{log.latency}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" className="p-10 text-center text-slate-500 italic">No traffic recorded yet. Hit the gateway to start metering.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const StatBox = ({ icon, title, value }) => (
  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center gap-4 shadow-sm hover:border-slate-600 transition group">
    <div className="p-3 bg-slate-900 rounded-lg group-hover:scale-110 transition duration-300">{icon}</div>
    <div>
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </div>
  </div>
);