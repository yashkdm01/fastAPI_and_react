import { useEffect, useState } from "react";
import { docService, authService } from "../services/api";
import { NeoButton } from "../components/ui/NeoButton";
import { FileText, Upload, LogOut, Trash2, Download, Link, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export const Dashboard = () => {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    try {
      const data = await docService.getAll();
      setDocs(data);
    } catch (err) {
      console.error("Failed to load docs", err);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      await docService.upload(file);
      await loadDocs();
    } catch (err) {
      alert("Upload Failed!");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("ARE YOU SURE YOU WANT TO DELETE THIS FILE?")) {
      try {
        await docService.delete(id);
        setDocs((current) => current.filter((d) => d.id !== id));
      } catch (err) {
        alert("Delete Failed.");
      }
    }
  };

  const handleDownload = (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "document.pdf";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async (e, docId) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/signatures/${docId}/share`);
      if (res.data.share_url) {
        await navigator.clipboard.writeText(res.data.share_url);
        setCopiedId(docId);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      alert("FAILED TO GENERATE SHARE LINK");
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100 dark:bg-dark-bg text-neo-black dark:text-neo-white font-sans">
      <div className="flex justify-between items-center mb-12 border-b-4 border-black pb-4 dark:border-white">
        <h1 className="text-5xl font-black italic tracking-tighter uppercase">
          Command_<span className="text-neo-blue">Center</span>
        </h1>
        <NeoButton variant="secondary" onClick={authService.logout}>
          <LogOut size={18} className="mr-2" /> LOGOUT
        </NeoButton>
      </div>

      <div className="mb-8 flex gap-4">
        <label className="cursor-pointer">
          <input
            type="file"
            className="hidden"
            accept="application/pdf"
            onChange={handleUpload}
          />
          <div className="flex items-center gap-2 px-6 py-3 bg-neo-yellow border-2 border-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all font-bold uppercase text-black">
            <Upload size={20} />
            {uploading ? "UPLOADING..." : "UPLOAD NEW INTEL"}
          </div>
        </label>
      </div>

      {docs.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-gray-400 text-center text-gray-500 font-mono text-xl uppercase">
          NO DOCUMENTS FOUND IN ARCHIVE.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docs.map((doc) => {
            const isSigned = doc.download_url && doc.download_url.includes("_signed");

            return (
              <div
                key={doc.id}
                className="border-2 border-black bg-white p-6 shadow-neo flex flex-col gap-4 relative dark:bg-dark-card dark:border-white dark:shadow-neo-dark"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-2 items-center">
                    <FileText size={40} className="text-neo-blue" />
                    <button 
                      onClick={(e) => handleShare(e, doc.id)}
                      className="p-2 border-2 border-black bg-neo-yellow hover:bg-yellow-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all text-black"
                      title="Copy Share Link"
                    >
                      {copiedId === doc.id ? <Check size={18} /> : <Link size={18} />}
                    </button>
                  </div>
                  <span className="bg-black text-white text-xs px-2 py-1 font-mono">
                    ID: {doc.id.toString().padStart(4, "0")}
                  </span>
                </div>

                <h3 className="font-bold text-xl truncate text-black dark:text-white" title={doc.title}>
                  {doc.title}
                </h3>

                {isSigned && (
                  <span className="bg-neo-green text-black border border-black text-xs font-bold px-2 py-1 w-max">
                    SIGNED DOCUMENT
                  </span>
                )}

                <div className="mt-2 pt-2 border-t border-dashed border-gray-300">
                  <p className="text-[10px] font-mono opacity-60 uppercase tracking-tighter">
                    Last Protocol: {isSigned ? "Signature Burned" : "Ready for Intel"}
                  </p>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <NeoButton
                      variant="primary"
                      onClick={() => navigate(`/sign/${doc.id}`)}
                    >
                      {isSigned ? "VIEW SIGNED" : "SIGN FILE"}
                    </NeoButton>

                    {doc.download_url && (
                      <button
                        onClick={() => handleDownload(doc.download_url, doc.title)}
                        className="flex items-center justify-center gap-2 border-2 border-black bg-neo-green text-black font-bold text-sm shadow-neo hover:shadow-none transition-all"
                      >
                        <Download size={16} /> DOWNLOAD
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 border-2 border-black bg-neo-red text-white hover:bg-red-600 font-bold text-sm transition-all shadow-neo hover:shadow-none"
                  >
                    <Trash2 size={16} /> DELETE PERMANENTLY
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
