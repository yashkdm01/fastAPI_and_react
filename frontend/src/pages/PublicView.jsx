import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import axios from "axios";
import { Download, ShieldCheck } from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const publicApi = axios.create({ baseURL: "fastapiandreact-production.up.railway.app" });
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const PublicView = () => {
  const { token } = useParams();
  const [doc, setDoc] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await publicApi.get(`/public/view/${token}`);
        setDoc(res.data);
      } catch (err) {
        const serverError = err.response?.data?.detail || "INVALID_OR_EXPIRED_TOKEN";
        setError(`PROTOCOL_ERROR: ${serverError}`);
      }
    };
    if (token) fetchDoc();
  }, [token]);

  const handleDownload = () => {
    if (!doc?.file_url) return;
    const link = document.createElement("a");
    link.href = `${doc.file_url}?t=${new Date().getTime()}`;
    link.download = `${doc.title || "signed_document"}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="border-8 border-black p-10 bg-red-600 text-white shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] font-black uppercase text-center rotate-1">
          <h2 className="text-4xl mb-4">ACCESS_DENIED</h2>
          <p>{error}</p>
        </div>
      </div>
    );

  if (!doc)
    return (
      <div className="min-h-screen flex items-center justify-center font-black animate-pulse text-2xl uppercase italic">
        Decrypting_Stream...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f0f0f0] text-black flex flex-col items-center p-6 md:p-12 font-sans">
      <header className="w-full max-w-5xl border-b-8 border-black mb-12 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="text-green-600" size={24} />
            <span className="text-xs font-mono font-bold uppercase tracking-widest bg-black text-white px-2 py-1">
              Verified Client Access
            </span>
          </div>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
            INTEL: {doc.title}
          </h1>
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center gap-3 px-8 py-4 bg-green-400 border-4 border-black font-black uppercase shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:bg-green-500"
        >
          <Download size={24} /> Download Final PDF
        </button>
      </header>

      <div className="relative border-[10px] border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] bg-white mb-20 overflow-hidden transform -rotate-1">
        <Document
          file={doc.file_url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={() => setError("RENDER_ERROR: FAILED TO LOAD PDF DATA")}
          loading={
            <div className="p-32 font-black text-3xl uppercase italic">
              Processing_Buffer...
            </div>
          }
        >
          {numPages && (
            <Page
              pageNumber={1}
              width={900}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          )}
        </Document>
      </div>

      <footer className="w-full max-w-5xl border-t-4 border-black pt-6 flex justify-between font-mono text-[10px] font-bold uppercase opacity-60 mb-10">
        <span>Node_ID: {token.substring(0, 8)}</span>
        <span>Signature_OS // World-Class Human Engineering</span>
      </footer>
    </div>
  );
};
