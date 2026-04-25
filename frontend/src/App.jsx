// frontend/src/App.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Upload, Send, Activity } from 'lucide-react';

// making the api url dynamic so it works locally and when deployed to vercel
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export default function App() {
  // keeping track of state here
  const [datasetId, setDatasetId] = useState(null);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileData, setFileData] = useState(null);

  // function to handle when user picks a file
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // creating form data to send file properly
    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
        // sending file to backend upload api
        const res = await axios.post(`${API_URL}/upload`, formData);
        
        // saving dataset id and info to state
        setDatasetId(res.data.dataset_id);
        setFileData(res.data.metadata);
        
        // showing success message in chat
        setChatHistory([{ role: 'system', content: `Dataset loaded: ${res.data.metadata.rows} rows, ${res.data.metadata.columns.length} columns.` }]);
    } catch (err) {
        alert('Error uploading file. Make sure the backend is running.');
    }
    setLoading(false);
  };

  // function to handle sending question to ai
  const handleQuery = async () => {
    if (!question || !datasetId) return;

    // adding user question to chat history
    const userMsg = { role: 'user', content: question };
    setChatHistory(prev => [...prev, userMsg]);
    setLoading(true);

    try {
        // sending question and dataset id to backend query api
        const res = await axios.post(`${API_URL}/query`, {
            question,
            dataset_id: datasetId
        });
        
        // adding ai response and chart data to chat history
        const systemMsg = { 
            role: 'system', 
            content: res.data.insight,
            chartData: res.data.chart_data 
        };
        setChatHistory(prev => [...prev, systemMsg]);
    } catch (err) {
        // showing error message if ai fails or if prompt format is wrong
        setChatHistory(prev => [...prev, { role: 'system', content: 'Failed to process query. Ensure data format matches the prompt and API key is valid.' }]);
    }
    
    // clearing input field
    setQuestion('');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* top header section */}
        <header className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <Activity className="text-emerald-500" />
          <h1 className="text-2xl font-bold tracking-tight">AI Data Analyst Dashboard</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* left column for file upload - injecting trademark glass panel styling */}
          <div className="md:col-span-1 glass-panel rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">1. Data Ingestion</h2>
            
            {/* hidden input inside a nice label wrapper */}
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors bg-zinc-950/50">
              <div className="text-center">
                <Upload className="mx-auto mb-2 text-zinc-400" />
                <span className="text-sm text-zinc-400">Upload CSV file</span>
              </div>
              <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
            </label>
            
            {/* showing file info if uploaded */}
            {fileData && (
              <div className="mt-4 p-4 bg-zinc-950/80 border border-zinc-800 rounded-lg text-sm shadow-inner">
                <p className="text-emerald-400 font-medium mb-2">Dataset Active</p>
                <p className="text-zinc-400">Rows: {fileData.rows}</p>
                <p className="text-zinc-400">Columns: {fileData.columns.join(', ')}</p>
              </div>
            )}
          </div>

          {/* right column for chat and charts - injecting trademark glass panel styling */}
          <div className="md:col-span-2 glass-panel rounded-xl flex flex-col h-[600px]">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 rounded-t-xl">
              <h2 className="text-lg font-semibold">2. Analysis Engine</h2>
            </div>
            
            {/* scrolling chat area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-zinc-950/30">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`p-4 rounded-lg shadow-md ${msg.role === 'user' ? 'bg-zinc-800 ml-12 border border-zinc-700' : 'bg-emerald-950/20 border border-emerald-900/40 mr-12'}`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  
                  {/* showing chart if data exists */}
                  {msg.chartData && msg.chartData.length > 0 && (
                    <div className="h-64 mt-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={msg.chartData}>
                          <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{fill: '#27272a'}} contentStyle={{backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px'}} />
                          <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ))}
              
              {/* showing loading text */}
              {loading && <p className="text-emerald-500 animate-pulse text-sm px-4">Processing via AI engine...</p>}
            </div>

            {/* bottom input area */}
            <div className="p-4 border-t border-zinc-800 flex gap-3 bg-zinc-900/50 rounded-b-xl">
              <input 
                type="text" 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="E.g., Which product had the highest sales?"
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm shadow-inner"
                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
              />
              <button 
                onClick={handleQuery}
                disabled={!datasetId || loading}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-3 rounded-lg transition-all flex items-center justify-center shadow-lg"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}