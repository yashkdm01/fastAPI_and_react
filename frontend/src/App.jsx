import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Mic, Square, Loader2, Download } from 'lucide-react';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = handleStopRecording;
      mediaRecorder.start();
      setIsRecording(true);
      setTranscript(""); 
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access is required.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleStopRecording = async () => {
    setIsProcessing(true);
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');

    try {
      const response = await axios.post('http://localhost:8000/api/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTranscript(response.data.transcript);
    } catch (error) {
      console.error("Transcription failed:", error);
      setTranscript("Error processing audio. Is the FastAPI backend running?");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 flex flex-col items-center justify-center p-6 font-sans selection:bg-white/20">
      
      {/* Main Glassmorphic Container */}
      <div className="w-full max-w-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-10 flex flex-col items-center relative overflow-hidden transition-all duration-500">
        
        {/* Subtle top-light reflection for glass effect */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        
        <h1 className="text-4xl font-extrabold mb-10 tracking-tight text-white drop-shadow-md">
          Neural Transcription
        </h1>
        
        <div className="flex gap-6 mb-10">
          {!isRecording ? (
            <button 
              onClick={startRecording}
              disabled={isProcessing}
              className="flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 px-8 py-4 rounded-full font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <Mic size={22} className="text-gray-300" />
              Initialize Recording
            </button>
          ) : (
            <button 
              onClick={stopRecording}
              className="flex items-center gap-3 bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-500/30 px-8 py-4 rounded-full font-semibold animate-pulse transition-all duration-300 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
            >
              <Square size={22} />
              Terminate & Process
            </button>
          )}
        </div>

        {/* Output Panel with Deep Contrast */}
        <div className="w-full bg-black/60 min-h-[250px] rounded-2xl p-8 border border-white/5 relative shadow-inner">
          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-2xl backdrop-blur-sm z-10">
              <Loader2 className="animate-spin text-white mb-4" size={40} />
              <p className="text-gray-400 font-medium tracking-wide">Processing audio buffer...</p>
            </div>
          )}
          
          {!isProcessing && transcript ? (
            <div className="animate-in fade-in duration-700">
              <p className="text-xl leading-relaxed text-gray-100 font-light">{transcript}</p>
            </div>
          ) : !isProcessing && (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-600 text-center font-medium">
                System idle. Awaiting audio input matrix.
              </p>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}